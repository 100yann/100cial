
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("like/<int:id>", views.like_post, name='like'),
    path("comment/<int:id>", views.add_comment, name='comment'),
    path("edit/<int:id>", views.edit_post, name="edit")
]
