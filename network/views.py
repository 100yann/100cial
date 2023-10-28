from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
import json
import os
from .models import User, Post, PostForm, Comment, CommentForm, UserDetails
from django.core.paginator import Paginator
from django.conf import settings
from django.core import serializers



def index(request):
    if request.method == "POST":
        form = PostForm(request.POST)
        if form.is_valid():
            new_post = form.cleaned_data['post']
            user = User.objects.get(id=request.user.id)
            Post.objects.create(author=user, post=new_post)
    post_list = Post.objects.all().order_by('-timestamp')
    
    # Set up Pagination
    p = Paginator(post_list, 10)
    page = request.GET.get('page')
    posts = p.get_page(page)

    context = {
        'create_post': PostForm,
        'posts': posts,
        'add_comment': CommentForm,
        'all_comments': Comment.objects.all().order_by("-timestamp")
    }
    return render(request, "network/index.html", context)


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


def like_post(request, id):
    post = Post.objects.get(pk=id)
    user = request.user
    
    if request.method == "PUT":
        if post.likes.filter(id=user.id).exists():
            post.likes.remove(request.user)
            messsage = f"User unliked post {id}"
            liked = False
        else:
            post.likes.add(request.user)
            messsage = f"User liked post {id}"
            liked = True
    
        return JsonResponse({
            'message': messsage,
            'found': liked
            })
    
    elif request.method == "GET":
        if post.likes.filter(id=user.id).exists():
            message = f'User already liked post {id}'
            liked = True
        else:
            message = f'User has not liked post {id}'
            liked = False

        return JsonResponse({
            'message': message,
            'found': liked
        })


def add_comment(request, id):
    if request.method == 'POST':
        data = json.loads(request.body)
        comment = data.get('comment')
        post = Post.objects.get(pk=id)
        user = User.objects.get(pk=request.user.id)
        new_comment = Comment(post=post, text=comment, user=user)
        new_comment.save()
        context = {
            'message': 'Comment added successfully!',
            'new_comment': {
                'id': new_comment.id,
                'text': new_comment.text,
                'user': new_comment.user.username,
                'timestamp': new_comment.timestamp,
                'userId': user.id
            }
        }
        return JsonResponse(context)
    

def edit_post(request, id):
    if request.method == 'PUT':
        data = json.loads(request.body)
        new_text = data.get('newText')
        updated_post = Post.objects.get(pk=id)
        if request.user == updated_post.author:
            updated_post.post = new_text
            updated_post.save()
            return JsonResponse({'message': 'Post edited successfully'})
        else:
            return JsonResponse({'message': 'Not authenticated'},status=401)
    return JsonResponse({'message': 'Not authenticated'}, status=401)


def user_profile(request, id):
    user = User.objects.get(pk=id)

    if request.user.id:
        active_user = User.objects.get(pk=request.user.id)
        if active_user != user:
            if active_user.following.filter(id=id).exists():
                status = 'Follow'
            else:
                status = 'Unfollow'

            if request.method == 'PUT':
                if status == 'Follow':
                    active_user.unfollow(user)
                    user.followed_by = user.followed_by - 1
                else:
                    active_user.follow(user)
                    user.followed_by = user.followed_by + 1

                user.save()
                return JsonResponse({
                    'message': status, 
                    'num_followers': user.followed_by
                    })

    if request.method == 'POST':
        message = {}
        new_birthday = request.POST.get('birthday')
        new_nationality = request.POST.get('country')
        new_description = request.POST.get('description')
        new_image = request.FILES.get('image')

        if new_birthday:
            user.birthday = new_birthday
            message['newBirthday'] = True
        if new_nationality:
            user.nationality = new_nationality
            message['newNationality'] = user.nationality.name
        if new_description:
            user.description = new_description
            message['newDescription'] = True
        if new_image:

            # remove old profile pic
            curr_profile_pic = user.profile_pic.url.replace('/media/', '')
            media_root = settings.MEDIA_ROOT
            cwd = os.getcwd()
            path_to_pp = os.path.join(cwd, media_root, curr_profile_pic)
            try:
                os.remove(path_to_pp)
            except FileNotFoundError:
                pass

            # save new profile pic
            file_name, file_extension = os.path.splitext(new_image.name)
            new_file_name = f"{user.username}_pp{file_extension}"
            path_to_new_pp = os.path.join(media_root, 'profile_pics', new_file_name)
            
            with open(path_to_new_pp, 'wb') as new_file:
                for chunk in new_image.chunks():
                    new_file.write(chunk)

            user.profile_pic = 'profile_pics/' + new_file_name
            message['newImage'] = user.profile_pic.url

        user.save()
        return JsonResponse(message)
            
    post_list = Post.objects.filter(author=user).order_by('-timestamp')
    comments = Comment.objects.filter(post__in=post_list).order_by("-timestamp")

    
    # Set up Pagination
    p = Paginator(post_list, 10)
    page = request.GET.get('page')
    posts = p.get_page(page)

    context = {
        'profile': user,
        'posts': posts,
        'all_comments': comments,
        'create_post': PostForm,
        'add_comment': CommentForm,
        'user_details': UserDetails,
    }

    try:
        context['follows'] = status
    except UnboundLocalError:
        pass

    return render(request, 'network/user_profile.html', context)


def following_page(request):
    following = User.objects.get(pk=request.user.id).following

    post_list = Post.objects.filter(author__in=following.all()).order_by('-timestamp')
    comments = Comment.objects.filter(post__in=post_list).order_by("-timestamp")

    
    # Set up Pagination
    p = Paginator(post_list, 10)
    page = request.GET.get('page')
    posts = p.get_page(page)
    context = {
        'posts': posts,
        'all_comments': comments,
        'add_comment': CommentForm,

    }
    return render(request, 'network/following_page.html', context)


def search(request, name):
    matching_users = User.objects.all().filter(username__icontains=name)
    results = []
    for user in matching_users:
        user_data = {
            'username': user.username,
            'profileId': user.pk,
        }
        results.append(user_data)
    return JsonResponse({
        'message': results
    })