<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    // ===============================
    // LIST CONVERSATIONS
    // ===============================
    public function conversations(Request $request)
    {
        $user = $request->user();

        $conversations = Conversation::with([
            'customer',
            'mitra',
            'messages' => function($q){
                $q->orderBy('created_at','asc'); // urutan pesan lama -> baru
            }
        ])
        ->where('customer_id', $user->id)
        ->orWhere('mitra_id', $user->id)
        ->get();

        $conversations->map(function($conv) use ($user){

            $conv->unread_count = Message::where('conversation_id', $conv->id)
                ->whereNull('read_at')
                ->where('sender_id','!=',$user->id)
                ->count();

            return $conv;
        });

        return response()->json($conversations);
    }


    // ===============================
    // GET MESSAGES
    // ===============================
    public function messages($conversationId)
    {
        $messages = Message::with('sender')
            ->where('conversation_id',$conversationId)
            ->orderBy('created_at','asc') // penting untuk urutan chat
            ->get();

        return response()->json($messages);
    }


    // ===============================
    // SEND MESSAGE
    // ===============================
    public function sendMessage(Request $request)
    {
        $request->validate([
            'conversation_id' => 'required|exists:conversations,id',
            'message' => 'required'
        ]);

        $message = Message::create([
            'conversation_id' => $request->conversation_id,
            'sender_id' => Auth::id(),
            'message' => $request->message
        ]);

        // load sender supaya langsung tersedia di frontend
        $message->load('sender');

        return response()->json($message);
    }


    // ===============================
    // MARK AS READ
    // ===============================
    public function markAsRead(Request $request,$conversationId)
    {
        Message::where('conversation_id',$conversationId)
            ->whereNull('read_at')
            ->where('sender_id','!=',$request->user()->id)
            ->update([
                'read_at'=>now()
            ]);

        return response()->json(['status'=>'ok']);
    }
}