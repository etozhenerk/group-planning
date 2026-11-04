import {useChatModel} from '@preview/ChatContext'
import {Dialog} from '@/shared/ui/Dialog'
import {PollCreateForm} from '@/features/date-poll/ui/PollCreateForm'
import {PlacePollForm} from '@/features/place-poll/ui/PlacePollForm'
import {TaskForm} from '@/features/preparation-task/ui/TaskForm'
import {meeting,user,people} from '@preview/data'
import styles from '@preview/ChatPreview.module.css'
export type ChatDialogsProps={kind:string|null;close:()=>void}
export const ChatDialogs=({kind,close}:ChatDialogsProps)=>{
 const model=useChatModel(),meeting=model.details,user=model.session
 const title=kind==='date'?'Предложить дату':kind==='place'?'Предложить место':kind==='task'?'Предложить задачу':'О встрече'
 return <Dialog open={kind!==null} title={model.formGuard?'Выйти без сохранения?':title} onClose={()=>kind==='date'?window.dispatchEvent(new Event('date-form-close')):close()} chatAction formLayout={kind!=='details'}>
  {kind==='date'&&<PollCreateForm key={model.scenario} meeting={meeting} session={user} done={close}/>}
  {kind==='place'&&<PlacePollForm meeting={meeting} session={user} done={close}/>}
  {kind==='task'&&<TaskForm meeting={meeting.id} session={user} done={close} active/>}
  {kind==='details'&&<div className={styles.details}><img src="./dinner.png" alt="Столик в кафе"/><h2>{meeting.title}</h2><p>Пятница, 6 ноября · 20:00</p><p>{meeting.place}</p><p>{meeting.description}</p><h3>Участники · 6</h3><p>Лена · организатор<br/>{people.filter(person=>person.id!=='lena').map(person=>person.display_name).join(', ')}, Миша, Аня</p></div>}
 </Dialog>
}
