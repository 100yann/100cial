from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import render
from django.urls import reverse
import json

from .models import User, Post, PostForm, Comment, CommentForm, UserDetails
from django.core.paginator import Paginator



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
                'timestamp': new_comment.timestamp
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
    active_user = User.objects.get(pk=request.user.id)
    user = User.objects.get(pk=id)

    if active_user != user:
        if active_user.following.filter(id=id).exists():
            status = 'Follow'
        else:
            status = 'Unfollow'

        if request.method == 'PUT':
            if status == 'Follow':
                active_user.unfollow(user)
            else:
                active_user.follow(user)
            return JsonResponse({'message': status})

    else:
            if request.method == 'PUT':
                message = {}
                data = json.loads(request.body)
                new_birthday = data['newBirthday']
                new_nationality = data['newNationality']
                new_description = data['newDescription']
                new_image = request.FILES.get('newImage')
                print(new_description)
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
                    user.profile_pic = new_image

                user.save()
                return JsonResponse(message)
            
    post_list = Post.objects.filter(author=user).order_by('-timestamp')
    comments = Comment.objects.filter(post__in=post_list)

    
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
        'user_details': UserDetails
    }

    try:
        context['follows'] = status
    except UnboundLocalError:
        pass
    
    return render(request, 'network/user_profile.html', context)


def following_page(request):
    following = User.objects.get(pk=request.user.id).following

    post_list = Post.objects.filter(author__in=following.all()).order_by('-timestamp')
    comments = Comment.objects.filter(post__in=post_list)

    
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
