import type {FeedEntry,Meeting,PreparationTask,DatePoll,PlacePoll,Reaction} from '@/entities/meeting'
export const user={user:{id:'misha',displayName:'Миша'},expiresAt:'2027-01-01T00:00:00Z',csrf:null}
export const people=[{id:'lena',display_name:'Лена',avatar_url:null},{id:'sasha',display_name:'Саша',avatar_url:null},{id:'dima',display_name:'Дима',avatar_url:null}]
export const meeting:Meeting={id:'chat-dinner',title:'Ужин в пятницу',startsAt:'2026-11-06T17:00:00Z',startsOn:'2026-11-06',timezone:'Europe/Moscow',place:'Кафе «Соседи», Покровка, 8',coverUrl:'/dinner',organizerId:'lena',participantCount:6,revision:'1',myRsvp:'going',myRsvpRevision:'1',description:'Соберёмся после работы: поужинаем и поболтаем.',createdAt:'2026-11-03T09:00:00Z'}
export const message=(id:string,person:string,text:string,minute:number):FeedEntry=>({id,meetingId:meeting.id,sequence:String(minute),kind:'message',actor:{id:person,displayName:person==='misha'?'Миша':person==='lena'?'Лена':'Саша'},occurredAt:'2026-11-04T06:'+String(minute).padStart(2,'0')+':00Z',clientRequestId:null,text,event:'',supported:true})
export const baseEntries:FeedEntry[]=[
 {...message('system-1','lena','',9),kind:'event',text:null,event:'Дима присоединился к встрече'},
 message('msg-1','lena','Столик на пятницу забронирован. Жду всех к восьми!',10),
 message('own-1','misha','Отлично! Буду минут на десять раньше.',12),
 message('msg-2','sasha','Я тоже. Вместе встретим остальных 🙂',13),
 {...message('task-entry','lena','',14),taskId:'task-bron'},
 message('msg-3','lena','Если кто-то задержится — напишите сюда.',16),
 message('own-unread','misha','Хорошо, напишу, если что.',17),
]
export const taskSeed:PreparationTask={id:'task-bron',meetingId:meeting.id,title:'Уточнить меню для вегетарианцев',author:{id:'lena',displayName:'Лена',avatarUrl:null},recipient:null,assignee:null,updatedBy:{id:'lena',displayName:'Лена',avatarUrl:null},state:'offered',revision:'1',createdAt:'2026-11-04T06:14:00Z',canAccept:true,canDecline:false,canCancel:false,canComplete:false}
export const pollSeed:DatePoll={id:'date-poll',meetingId:meeting.id,author:{id:'lena',displayName:'Лена'},settings:{multipleAnswers:true,allowRevoting:true,allowNewOptions:true,anonymous:false,hideResults:false},options:[{id:'fri',date:'2026-11-06',votes:2,voters:[{id:'lena',displayName:'Лена'},{id:'dima',displayName:'Дима'}]},{id:'sat',date:'2026-11-07',votes:1,voters:[{id:'sasha',displayName:'Саша'}]}],state:'open',revision:'1',myVoteRevision:'0',myOptionIds:[],createdAt:'2026-11-04T06:15:00Z',closesAt:'2026-11-05T18:00:00Z',closedAt:null,leaderOptionIds:[],appliedOptionId:null,canVote:true,canAddOptions:true,canResolve:false}
export const placeSeed:PlacePoll={id:'place-poll',meetingId:meeting.id,place:'Пиццерия на Маросейке',explanation:'Рядом с метро, есть большой стол.',previousPlace:meeting.place,state:'open',revision:'1',myVoteRevision:'0',myVote:null,votesFor:2,votesAgainst:1,closesAt:'2026-11-05T18:00:00Z',canVote:true}
export const reactionSeed:Record<string,Reaction[]>={'msg-2':[{emoji:'👍',count:2,mine:false,users:[people[0]!,people[2]!]}]}
export const mediaSeed={id:'photo-dinner',meeting_id:meeting.id,file_name:'Наш столик.png',content_type:'image/png',size_bytes:2300000,kind:'photo' as const,purpose:'message' as const,status:'published' as const,download_url:'./dinner.png',thumbnail_url:'./dinner.png',created_at:'2026-11-04T06:16:00Z',uploaded_by:people[0]!}
