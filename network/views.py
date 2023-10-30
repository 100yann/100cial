from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render, redirect
from django.urls import reverse
import json
import os
from .models import User, Post, PostForm, Comment, CommentForm, UserDetails
from django.core.paginator import Paginator
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from PIL import Image


def index(request):
    if request.method == "POST":
        form = PostForm(request.POST)
        if form.is_valid():
            new_post = form.cleaned_data['post']
            time = timezone.now()
            user = User.objects.get(id=request.user.id)
            Post.objects.create(author=user, post=new_post, timestamp=time)
    post_list = Post.objects.all().order_by('-timestamp')
    
    # Set up Pagination
    p = Paginator(post_list, 10)
    page = request.GET.get('page')
    posts = p.get_page(page)
    if not page:
        page = '1'
    context = {
        'create_post': PostForm,
        'posts': posts,
        'add_comment': CommentForm,
        'all_comments': Comment.objects.all().order_by("-timestamp"),
        'curr_page': int(page)
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
    if request.method == "PUT":
        post = Post.objects.get(pk=id)
        user = request.user
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
    
    elif request.method == "POST":
        data = json.loads(request.body)
        post_text = data['post']
        user = User.objects.get(pk=id)
        time = timezone.now()
        post = Post.objects.create(author=user, post=post_text, timestamp=time)
        return JsonResponse({
            'message': 'Posted successfully',
            'timestamp': time,
            'username': user.username,
            'user_pfp': user.profile_pic.url,
            'postId': post.pk
        })
    elif request.method == "GET":
        post = Post.objects.get(pk=id)
        user = request.user
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

@login_required(login_url='index')
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
                'userId': user.id,
                'user_pfp': user.profile_pic.url
            }
        }
        return JsonResponse(context)
    
@login_required(login_url='/login')
def edit_post(request, id):
    if request.method == 'PUT' and request.user.is_authenticated:
        data = json.loads(request.body)
        new_text = data.get('newText')
        updated_post = Post.objects.get(pk=id)
        if request.user == updated_post.author:
            updated_post.post = new_text
            updated_post.save()
            return JsonResponse({'message': 'Post edited successfully'})
        else:
            return JsonResponse({'message': 'Not authenticated'},status=401)
    return redirect('index')


def user_profile(request, id):
    user = User.objects.get(pk=id)

    if request.user.id:
        if request.user.id != user.pk and request.method =='PUT':
            active_user = User.objects.get(pk=request.user.id)
            user_to_follow = User.objects.get(pk=id)

            if active_user.following.filter(id=id).exists():
                message = 'Follow'
                active_user.unfollow(user_to_follow)
            else:
                message = 'Unfollow'
                active_user.follow(user_to_follow)

            active_user.save()
            followers = User.objects.filter(following=user).count()

            return JsonResponse({
                'message': message, 
                'num_followers': followers
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
            image = Image.open(new_image)
            image.resize((300,300))

            # remove old profile pic
            curr_profile_pic = user.profile_pic.url.replace('/media/', '')
            media_root = settings.MEDIA_ROOT
            cwd = os.getcwd()
            path_to_pp = os.path.join(cwd, media_root, curr_profile_pic)
            if curr_profile_pic != 'profile_pics/default.png':
                try:
                    os.remove(path_to_pp)
                except FileNotFoundError:
                    pass

            # save new profile pic
            file_name, file_extension = os.path.splitext(new_image.name)
            new_file_name = f"{user.username}_pp{file_extension}"
            path_to_new_pp = os.path.join(media_root, 'profile_pics', new_file_name)
            
            image.save(path_to_new_pp)
            user.profile_pic = 'profile_pics/' + new_file_name
            message['newImage'] = user.profile_pic.url

        user.save()
        return JsonResponse(message if message else {})
            
    post_list = Post.objects.filter(author=user).order_by('-timestamp')
    comments = Comment.objects.filter(post__in=post_list).order_by("-timestamp")

    followers = User.objects.filter(following=user)
    follower_ids = [follower.id for follower in followers]
    if request.user.id in follower_ids:
        follows = True
    else:
        follows = False
    context = {
        'profile': user,
        'posts': post_list,
        'all_comments': comments,
        'create_post': PostForm,
        'add_comment': CommentForm,
        'user_details': UserDetails,
        'followers': followers.count,
        'follows': follows
    }

    return render(request, 'network/user_profile.html', context)


@login_required(login_url='/login')
def following_page(request):
    following = User.objects.get(pk=request.user.id).following

    post_list = Post.objects.filter(author__in=following.all()).order_by('-timestamp')
    comments = Comment.objects.filter(post__in=post_list).order_by("-timestamp")

    
    # Set up Pagination
    p = Paginator(post_list, 10)
    page = request.GET.get('page')
    if not page:
        page = '1'
    posts = p.get_page(page)
    context = {
        'posts': posts,
        'all_comments': comments,
        'add_comment': CommentForm,
        'curr_page': int(page)

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