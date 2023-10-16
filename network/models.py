from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


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

    def __str__(self) -> str:
        return ", ".join(f"{key}: {value}" for key, value in vars(self).items())


from django import forms


class PostForm(forms.ModelForm):
    class Meta:
        model = Post
        fields = ["post"]
        widgets = {
            'post': forms.TextInput(attrs={'class': 'form-control'})
        }


class CommentForm(forms.ModelForm):
    class Meta:
        model = Comment
        fields = ["text"]
        widgets = {
            'text': forms.TextInput(attrs={'class': 'form-control'})
        }
