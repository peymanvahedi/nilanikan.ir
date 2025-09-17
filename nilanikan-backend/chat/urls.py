# chat/urls.py
from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    # API endpoints
    path('conversations/', views.ConversationListView.as_view(), name='conversation-list'),
    path('conversations/<slug:room>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<slug:room>/messages/', views.MessageListView.as_view(), name='message-list'),
    path('conversations/<slug:room>/send/', views.SendMessageView.as_view(), name='send-message'),
    path('history/', views.ChatHistoryView.as_view(), name='chat-history'),
]
