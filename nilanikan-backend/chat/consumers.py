# chat/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Conversation, Message

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room = self.scope["url_route"]["kwargs"]["room"]
        self.room_group_name = f"chat_{self.room}"
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_text = text_data_json.get('message', '')
            sender_id = text_data_json.get('sender_id')
            
            if message_text and sender_id:
                # Save message to database
                message = await self.save_message(
                    room=self.room,
                    message_text=message_text,
                    sender_id=sender_id
                )
                
                # Send message to room group
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message_text,
                        'sender_id': sender_id,
                        'message_id': message.id,
                        'timestamp': message.created_at.isoformat(),
                    }
                )
                
        except Exception as e:
            await self.send(text_data=json.dumps({
                'error': f'Invalid message format: {str(e)}'
            }))

    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'message_id': event['message_id'],
            'timestamp': event['timestamp'],
        }))

    @database_sync_to_async
    def save_message(self, room, message_text, sender_id):
        """Save message to database"""
        try:
            # Get or create conversation
            conversation, created = Conversation.objects.get_or_create(
                room=room
            )
            
            # Get sender user
            sender = User.objects.get(id=sender_id)
            
            # Create message
            message = Message.objects.create(
                conversation=conversation,
                sender=sender,
                text=message_text
            )
            
            return message
            
        except User.DoesNotExist:
            # Handle guest user or create anonymous user
            guest_user, created = User.objects.get_or_create(
                username=f"guest_{room}",
                defaults={'first_name': 'Guest'}
            )
            
            message = Message.objects.create(
                conversation=conversation,
                sender=guest_user,
                text=message_text
            )
            
            return message
