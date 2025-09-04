from django.urls import path
from .views import RegisterView, LoginView, MeView

urlpatterns = [
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/",    LoginView.as_view(),    name="login"),
    path("api/auth/me/",       MeView.as_view(),       name="me"),
]
