import React from 'react';
export const roomChoices=offer=>offer?.rooms|| (offer?.id?[offer]:[]);
export const initialRoom=offer=>{const rooms=roomChoices(offer);return rooms.length===1?rooms[0].id:'';};
export default function RoomChoice({offer,value,onChange}){
 const rooms=roomChoices(offer);
 return <div className="room-choice"><label>Ustozning xonasi<select aria-label="Ustozning xonasi" required value={value} onChange={e=>onChange(e.target.value)}><option value="">Xonani tanlang</option>{rooms.map(room=><option value={room.id} key={room.id}>{room.ownerName||room.title} · {room.code||room.title}</option>)}</select></label><p>{rooms.length?'Faqat tanlangan ustozga natijangiz yuboriladi.':'Faol xona topilmadi. Ustoz mashqni ochganini tekshiring.'}</p></div>;
}
