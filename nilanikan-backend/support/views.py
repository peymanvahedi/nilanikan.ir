from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Ticket, TicketReply
from .serializers import TicketSerializer, TicketReplySerializer

class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Ticket.objects.filter(user=self.request.user).prefetch_related('replies')
        if self.request.user.is_staff:
            qs = Ticket.objects.all().prefetch_related('replies')
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        tr = TicketReply.objects.create(ticket=ticket, user=request.user, message=request.data.get('message',''))
        return Response(TicketReplySerializer(tr).data)
