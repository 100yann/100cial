
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("like/<int:id>", views.like_post, name='like'),
    path("comment/<int:id>", views.add_comment, name='comment'),
    path("edit/<int:id>", views.edit_post, name="edit"),
    path('user/<int:id>', views.user_profile, name='user'),
    path('following', views.following_page, name='following'),
    path('search/<str:name>', views.search, name='search')
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)