import React, { useState, useEffect, useRef, useCallback } from "react";
import CustomerLayout from "../../components/dashboard/CustomerLayout";
import { Search, MoreVertical, Send, Paperclip, Smile, Phone, Video } from "lucide-react";

export default function Pesan() {
	const [selectedChat, setSelectedChat] = useState(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [inputMessage, setInputMessage] = useState("");
	const [chatList, setChatList] = useState([]);
	const [messages, setMessages] = useState([]);
	const [user, setUser] = useState(null);
	const quickReplies = ["Iya, sudah sesuai", "Pickup address sudah benar", "Bisa ubah jam keberangkatan?", "Tolong konfirmasi order saya"];

	// Ref untuk auto-scroll chat
	const chatEndRef = useRef(null);

	const scrollToBottom = () => {
		chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const handleQuickReply = (text) => {
		setInputMessage(text);
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages, selectedChat]);

	const fetchConversations = useCallback(async () => {
		if (!user) return;

		const res = await fetch("http://127.0.0.1:8000/api/conversations", {
			headers: {
				Authorization: `Bearer ${localStorage.getItem("token")}`,
			},
		});

		const data = await res.json();

		const formatted = data.map((conv) => {
			const lastMessage = conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;

			const otherUser = user.id === conv.customer_id ? conv.mitra : conv.customer;

			return {
				id: conv.id,
				name: otherUser?.name || "User",
				msg: lastMessage?.message || "Belum ada pesan",
				time: lastMessage
					? new Date(lastMessage.created_at).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})
					: "",
				avatar: otherUser?.avatar ? `http://127.0.0.1:8000/storage/${otherUser.avatar}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.id}`,
				online: false,
				unread: conv.unread_count || 0,
			};
		});

		setChatList(formatted);
	}, [user]);

	useEffect(() => {
		fetch("http://127.0.0.1:8000/api/user", {
			headers: {
				Authorization: `Bearer ${localStorage.getItem("token")}`,
			},
		})
			.then((res) => res.json())
			.then((data) => setUser(data));
	}, []);

	useEffect(() => {
		if (!user) return;

		const load = async () => {
			await fetchConversations();
		};

		load();

		// optional cleanup placeholder if you later add cancellation:
		return () => {};
	}, [user, fetchConversations]);

	const loadMessages = async (conversationId) => {
		const res = await fetch(`http://127.0.0.1:8000/api/conversations/${conversationId}/messages`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem("token")}`,
			},
		});

		const data = await res.json();

		const sorted = data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

		setMessages(sorted);
	};

	useEffect(() => {
		if (!selectedChat) return;

		const interval = setInterval(() => {
			loadMessages(selectedChat.id);
			fetchConversations();
		}, 2000);

		return () => clearInterval(interval);
	}, [selectedChat, fetchConversations]);

	// Fungsionalitas Pencarian
	const filteredChat = chatList.filter((chat) => chat.name.toLowerCase().includes(searchQuery.toLowerCase()));

	// Fungsionalitas Kirim Pesan
	const handleSendMessage = async (e) => {
		e.preventDefault();

		if (!inputMessage.trim()) return;

		const res = await fetch("http://127.0.0.1:8000/api/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${localStorage.getItem("token")}`,
			},
			body: JSON.stringify({
				conversation_id: selectedChat.id,
				message: inputMessage,
			}),
		});

		const data = await res.json();

		setMessages((prev) => {
			const updated = [...prev, data];

			return updated.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
		});

		setInputMessage("");

		setChatList((prev) =>
			prev.map((c) =>
				c.id === selectedChat.id
					? {
							...c,
							msg: data.message,
							time: new Date(data.created_at).toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit",
							}),
						}
					: c,
			),
		);
	};

	return (
		<CustomerLayout>
			<div className="w-full max-w-screen-xl mx-auto px-4 py-6 h-[calc(100vh-120px)]">
				<div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex overflow-hidden h-full">
					{/* SISI KIRI: Daftar Pesan */}
					<div className={`w-full lg:w-[400px] flex flex-col border-r border-gray-50 transition-all duration-300 ${selectedChat ? "hidden lg:flex" : "flex"}`}>
						<div className="p-6 border-b border-gray-50 bg-indigo-900 text-white">
							<h1 className="text-xl font-black tracking-tight mb-4">Pesan</h1>
							<div className="relative group">
								<Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchQuery ? "text-white" : "text-indigo-300"}`} />
								<input
									type="text"
									placeholder="Cari percakapan..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-sm text-white placeholder:text-indigo-200 focus:outline-none focus:bg-white/20 transition-all focus:ring-1 focus:ring-white/30"
								/>
							</div>
						</div>

						<div className="flex-1 overflow-y-auto no-scrollbar">
							{filteredChat.length > 0 ? (
								filteredChat.map((chat) => (
									<div
										key={chat.id}
										onClick={() => {
											setSelectedChat(chat);
											loadMessages(chat.id);

											// mark messages as read
											fetch(`http://127.0.0.1:8000/api/conversations/${chat.id}/mark-read`, {
												method: "POST",
												headers: {
													Authorization: `Bearer ${localStorage.getItem("token")}`,
												},
											});

											// update unread di UI
											setChatList((prev) => prev.map((c) => (c.id === chat.id ? { ...c, unread: 0 } : c)));
										}}
										className={`flex items-center gap-4 p-5 cursor-pointer transition-all border-b border-gray-50/50 hover:bg-indigo-50/30 ${selectedChat?.id === chat.id ? "bg-indigo-50 border-l-4 border-l-indigo-600 scale-[1.01]" : ""}`}
									>
										<div className="relative shrink-0">
											{chat.isBot ? (
												<div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
													<Smile size={24} />
												</div>
											) : (
												<img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover border border-gray-100 shadow-sm" />
											)}
											{chat.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>}
										</div>

										<div className="flex-1 min-w-0">
											<div className="flex justify-between items-center mb-1">
												<h3 className={`text-sm font-bold truncate ${selectedChat?.id === chat.id ? "text-indigo-900" : "text-gray-800"}`}>{chat.name}</h3>
												<span className="text-[10px] text-gray-400 font-medium">{chat.time}</span>
											</div>
											<p className="text-xs text-gray-400 truncate leading-relaxed">{chat.msg}</p>
										</div>

										{chat.unread > 0 && <div className="w-5 h-5 bg-pink-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm shadow-pink-200 shrink-0 animate-bounce">{chat.unread}</div>}
									</div>
								))
							) : (
								<div className="p-10 text-center text-gray-400 text-sm italic">Kontak tidak ditemukan.</div>
							)}
						</div>
					</div>

					{/* SISI KANAN: Chat Window */}
					<div className={`flex-1 flex flex-col bg-gray-50/30 transition-all duration-500 ${!selectedChat ? "hidden lg:flex items-center justify-center" : "flex"}`}>
						{selectedChat ? (
							<>
								{/* Header Chat */}
								<div className="p-4 bg-white border-b border-gray-50 flex items-center justify-between shadow-sm z-10">
									<div className="flex items-center gap-3">
										<button onClick={() => setSelectedChat(null)} className="p-2 lg:hidden text-gray-400 hover:text-indigo-900 transition-colors">
											<ChevronLeft />
										</button>
										<div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden border border-indigo-50">
											{selectedChat.isBot ? <Smile className="text-indigo-600" /> : <img src={selectedChat.avatar} className="w-full h-full object-cover" />}
										</div>
										<div>
											<h3 className="text-sm font-bold text-gray-800">{selectedChat.name}</h3>
											{/* <p className={`text-[10px] font-bold uppercase tracking-wider ${selectedChat.online ? "text-emerald-500" : "text-gray-400"}`}>{selectedChat.online ? "Online" : "Offline"}</p> */}
										</div>
									</div>
									<div className="flex items-center gap-1 text-gray-400">
										<button onClick={() => alert("Fitur Telepon belum tersedia")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
											<Phone size={18} />
										</button>
										<button onClick={() => alert("Fitur Video Call belum tersedia")} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
											<Video size={18} />
										</button>
										<button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
											<MoreVertical size={18} />
										</button>
									</div>
								</div>

								{/* Messages Area */}
								<div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
									<div className="flex justify-center">
										<span className="text-[10px] bg-white border border-gray-100 px-3 py-1 rounded-full text-gray-400 font-bold uppercase tracking-widest shadow-sm">Today</span>
									</div>

									{/* Render Dynamic Messages */}
									{messages.map((m) => (
										<div key={m.id} className={`flex ${m.sender_id === user.id ? "flex-row-reverse ml-auto" : ""} items-end gap-2 max-w-[80%]`}>
											<div className={`p-4 rounded-2xl shadow ${m.sender_id === user.id ? "bg-indigo-900 text-white rounded-br-none" : "bg-white border rounded-bl-none"}`}>
												<p className="text-sm">{m.message}</p>
												<p className="text-[10px] mt-1 opacity-70 text-right">
													{new Date(m.created_at).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
												</p>
											</div>
										</div>
									))}
									<div ref={chatEndRef} />
								</div>

								{/* Quick Reply Options */}
								<div className="px-6 pt-4 flex flex-wrap gap-2 bg-white">
									{quickReplies.map((reply, index) => (
										<button key={index} type="button" onClick={() => handleQuickReply(reply)} className="text-xs bg-indigo-50 text-indigo-700 px-3 py-2 rounded-full hover:bg-indigo-100 transition-all border border-indigo-100">
											{reply}
										</button>
									))}
								</div>

								{/* Input Chat */}
								<form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-gray-50">
									<div className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
										<button type="button" className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
											<Paperclip size={20} />
										</button>
										<input
											type="text"
											value={inputMessage}
											onChange={(e) => setInputMessage(e.target.value)}
											placeholder="Tulis pesan..."
											className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-gray-400 text-gray-700"
										/>
										<button type="button" className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
											<Smile size={20} />
										</button>
										<button
											type="submit"
											disabled={!inputMessage.trim()}
											className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg ${inputMessage.trim() ? "bg-indigo-900 text-white shadow-indigo-200 hover:bg-indigo-800" : "bg-gray-200 text-gray-400"}`}
										>
											<Send size={18} />
										</button>
									</div>
								</form>
							</>
						) : (
							<div className="flex flex-col items-center justify-center text-center p-12 group">
								<div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
									<Send size={40} />
								</div>
								<h2 className="text-xl font-black text-gray-800 mb-2 tracking-tight">Mulai Percakapan</h2>
								<p className="text-sm text-gray-400 max-w-xs leading-relaxed">Pilih salah satu pesan di samping untuk memulai obrolan dengan mitra.</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</CustomerLayout>
	);
}

function ChevronLeft() {
	return (
		<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
		</svg>
	);
}
