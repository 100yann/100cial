from typing import Any
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    following = models.ManyToManyField('self', related_name='followers', blank=True)

    def follow(self, follow_user):
        if follow_user != self:
            self.following.add(follow_user)

    def unfollow(self, unfollow_user):
        self.following.remove(unfollow_user)


# Model to store all posts
class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.CharField(max_length=400)
    timestamp = models.DateTimeField(auto_now_add=True, blank=True)
    likes = models.ManyToManyField(User, related_name="liked_posts", default=0)

    def __str__(self) -> str:
        return ", ".join(f"{key}: {value}" for key, value in vars(self).items())

    def likes_count(self) -> int:
        return self.likes.all().count()
        

# Model to store all comments
class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    text = models.TextField(max_length=400)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True, blank=True)


    def __str__(self) -> str:
        return ", ".join(f"{key}: {value}" for key, value in vars(self).items())


from django import forms


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ["post"]
        widgets = {
            'post': forms.Textarea(attrs={
                                        'cols': 80, 
                                        'rows': 20,
                                        'class': 'form-control',
                                        'id': 'post-text'})
        }
        labels = {
            'post': ''
        }


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ["text"]
        widgets = {
            'text': forms.Textarea(attrs={
                                        'cols': 80, 
                                        'rows': 20,
                                        'class': 'form-control', 
                                        'id': 'comment-value'})
        }
        labels = {
            'text': ''
        }
