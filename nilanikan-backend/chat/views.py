# chat/views.py
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer, SendMessageSerializer
import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class ConversationListView(generics.ListCreateAPIView):
    """لیست گفتگوها یا ایجاد گفتگوی جدید"""
    queryset = Conversation.objects.all().order_by('-created_at')
    serializer_class = ConversationSerializer
    permission_classes = [AllowAny]

class ConversationDetailView(generics.RetrieveAPIView):
    """جزئیات یک گفتگو"""
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer
    permission_classes = [AllowAny]
    lookup_field = 'room'

class MessageListView(generics.ListAPIView):
    """لیست پیام‌های یک گفتگو"""
    serializer_class = MessageSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        room = self.kwargs['room']
        conversation = get_object_or_404(Conversation, room=room)
        return Message.objects.filter(conversation=conversation).order_by('created_at')

class SendMessageView(generics.CreateAPIView):
    """ارسال پیام جدید"""
    serializer_class = SendMessageSerializer
    permission_classes = [AllowAny]
    
    def create(self, request, *args, **kwargs):
        room = self.kwargs['room']
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        message_text = serializer.validated_data['message']
        sender_id = serializer.validated_data.get('sender_id')
        
        # Get or create conversation
        conversation, created = Conversation.objects.get_or_create(room=room)
        
        # Handle sender
        if sender_id:
            try:
                sender = User.objects.get(id=sender_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'کاربر یافت نشد'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Create guest user
            sender, created = User.objects.get_or_create(
                username=f"guest_{room}",
                defaults={'first_name': 'مهمان'}
            )
        
        # Create message
        message = Message.objects.create(
            conversation=conversation,
            sender=sender,
            text=message_text
        )
        
        # Send to WebSocket
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f"chat_{room}",
                {
                    'type': 'chat_message',
                    'message': message_text,
                    'sender_id': sender.id,
                    'message_id': message.id,
                    'timestamp': message.created_at.isoformat(),
                }
            )
        
        return Response(
            MessageSerializer(message).data,
            status=status.HTTP_201_CREATED
        )

class ChatHistoryView(generics.ListAPIView):
    """تاریخچه کامل چت برای ادمین"""
    serializer_class = ConversationSerializer
    permission_classes = [AllowAny]  # در production باید IsAdminUser باشد
    
    def get_queryset(self):
        return Conversation.objects.prefetch_related('messages__sender').order_by('-created_at')
