from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','username','first_name','last_name','email','is_staff','is_superuser']
        read_only_fields = ['id','is_staff','is_superuser']

class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=False, allow_blank=True,
        validators=[UniqueValidator(queryset=User.objects.all(), message="این ایمیل قبلاً ثبت شده است.")]
    )
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, v):
        return User.objects.create_user(
            username=v['username'].strip().lower(),
            email=(v.get('email') or '').strip().lower() or None,
            password=v['password']
        )
