from rest_framework import serializers
from .models import Ticket, TicketReply

class TicketReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = TicketReply
        fields = ['id','user','message','created_at']
        read_only_fields = ['user','created_at']

class TicketSerializer(serializers.ModelSerializer):
    replies = TicketReplySerializer(many=True, read_only=True)
    class Meta:
        model = Ticket
        fields = ['id','user','subject','message','status','created_at','replies']
        read_only_fields = ['user','created_at']
