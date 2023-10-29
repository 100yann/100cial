from typing import Any
from django.contrib.auth.models import AbstractUser
from django.db import models
from django_countries.fields import CountryField

class User(AbstractUser):
    following = models.ManyToManyField('self', symmetrical=False, related_name='followers', blank=True, null=True)
    birthday = models.DateField(blank=True, null=True)
    nationality = CountryField(null=True)
    profile_pic = models.ImageField(upload_to="profile_pics", default='profile_pics/default.png')
    description = models.TextField(max_length=600, null=True)

    def follow(self, follow_user):
        if follow_user != self:
            self.following.add(follow_user)

    def unfollow(self, unfollow_user):
        self.following.remove(unfollow_user)


# Model to store all posts
class Post(models.Model):
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.CharField(max_length=400)
    timestamp = models.DateTimeField(blank=True)
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
                                        'id': 'new-post'})
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

class MyDateInput(forms.widgets.DateInput):
    input_type = 'date'


class UserDetails(forms.ModelForm):
    class Meta:
        model = User
        fields = ["birthday", "nationality", "profile_pic", "description"]

        widgets = {
            'birthday': forms.DateInput(attrs=dict(type='date')),
        }

    description = forms.CharField(widget=forms.Textarea, required=False)


    def __init__(self, *args, **kwargs):
        super(UserDetails, self).__init__(*args, **kwargs)
        self.fields['profile_pic'].widget.attrs.update({
            'name': 'newImage',
            'accept': 'image/*',
        })

        for visible in self.visible_fields():
            visible.field.widget.attrs['class'] = 'form-control'
            visible.field.widget.attrs['id'] = f'new-{visible.name}'