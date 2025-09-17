# chat/serializers.py
from rest_framework import serializers
from .models import Conversation, Message
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'text', 'created_at']
        read_only_fields = ['id', 'created_at']

class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'room', 'created_at', 'messages', 'message_count', 'last_message']
        read_only_fields = ['id', 'created_at']
    
    def get_message_count(self, obj):
        return obj.messages.count()
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None

class SendMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=1000)
    sender_id = serializers.IntegerField(required=False)
    
    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError("پیام نمی‌تواند خالی باشد.")
        return value.strip()
