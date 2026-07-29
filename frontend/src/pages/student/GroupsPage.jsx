import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

export default function GroupsPage() {
  const { courseId } = useParams()
  const { user }     = useAuth()
  const [groups, setGroups]         = useState([])
  const [students, setStudents]     = useState([])
  const [course, setCourse]         = useState(null)
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [groupName, setGroupName]   = useState('')
  const [addMember, setAddMember]   = useState({})
  const [saving, setSaving]         = useState(false)

  useEffect(() => { fetchAll() }, [courseId])

  async function fetchAll() {
    const [c, g, s] = await Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/courses/${courseId}/groups`),
      api.get(`/courses/${courseId}/students`),
    ])
    setCourse(c.data); setGroups(g.data); setStudents(s.data)
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault(); setSaving(true)
    try {
      const { data } = await api.post(`/courses/${courseId}/groups`, { name: groupName })
      setGroups([...groups, data]); setGroupName(''); setShowCreate(false)
      toast.success('ቡድን ተፈጥሯል!')
    } catch (err) { toast.error(err.response?.data?.message || 'አልተሳካም') }
    finally { setSaving(false) }
  }

  async function handleAddMember(groupId) {
    const userId = addMember[groupId]
    if (!userId) return toast.error('ተማሪ ይምረጡ')
    try {
      const { data } = await api.post(`/groups/${groupId}/members`, { user_id: userId })
      setGroups(groups.map(g => g.id===groupId ? data : g))
      setAddMember({ ...addMember, [groupId]:'' })
      toast.success('አባል ታከለ')
    } catch (err) { toast.error(err.response?.data?.message || 'አልተሳካም') }
  }

  async function handleRemoveMember(groupId, userId) {
    try {
      await api.delete(`/groups/${groupId}/members/${userId}`)
      setGroups(groups.map(g => g.id===groupId ? {...g, members:g.members.filter(m=>m.id!==userId)} : g))
      toast.success('አባል ተወገደ')
    } catch { toast.error('አልተሳካም') }
  }

  async function handleDelete(groupId) {
    if (!confirm('ይህን ቡድን ይሰርዙ?')) return
    try { await api.delete(`/groups/${groupId}`); setGroups(groups.filter(g=>g.id!==groupId)); toast.success('ቡድን ተሰርዟል') }
    catch { toast.error('አልተሳካም') }
  }

  if (loading) return <Spinner />

  const myGroup = groups.find(g => g.members?.some(m => m.id===user.id))

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/student/courses/${courseId}/assignments`} className="text-sm text-blue-600 hover:underline">← {course?.title}</Link>
        <h1 className="text-2xl font-bold mt-1">ቡድኖች</h1>
        <p className="text-gray-500 text-sm">ለቡድን ምደባዎች ቡድን ይፍጠሩ ወይም ይቀላቀሉ</p>
      </div>

      {myGroup && (
        <div className="card bg-green-50 border-green-200">
          <p className="text-green-800 font-semibold">✓ ቡድኖ: {myGroup.name}</p>
          <p className="text-green-600 text-sm mt-1">{myGroup.members?.length} አባላት</p>
        </div>
      )}

      {!myGroup && (
        !showCreate ? (
          <button onClick={() => setShowCreate(true)} className="btn-primary">+ አዲስ ቡድን ፍጠር</button>
        ) : (
          <div className="card">
            <h2 className="font-semibold mb-3">ቡድን ፍጠር</h2>
            <form onSubmit={handleCreate} className="flex gap-3">
              <input className="input flex-1" placeholder="የቡድን ስም ለምሳሌ: ቡድን አልፋ"
                value={groupName} onChange={e => setGroupName(e.target.value)} required />
              <button type="submit" disabled={saving} className="btn-primary">{saving?'እየፈጠረ…':'ፍጠር'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowCreate(false)}>ሰርዝ</button>
            </form>
          </div>
        )
      )}

      {groups.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">ምንም ቡድን የለም። ይፍጠሩ!</div>
      ) : (
        <div className="space-y-4">
          {groups.map(group => {
            const isMember  = group.members?.some(m => m.id===user.id)
            const isLeader  = group.members?.some(m => m.id===user.id && m.pivot?.is_leader)
            const memberIds = new Set(group.members?.map(m=>m.id)||[])
            const avail     = students.filter(s => !memberIds.has(s.id))

            return (
              <div key={group.id} className="card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{group.name}</h3>
                    <p className="text-xs text-gray-400">የፈጠረው: {group.creator?.name}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {isMember && <span className="badge-green">ቡድኖ</span>}
                    {isLeader && <span className="badge-blue">መሪ</span>}
                    {(isLeader || user.role==='teacher') && (
                      <button onClick={() => handleDelete(group.id)} className="btn-danger btn-sm">ሰርዝ</button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {!group.members?.length
                    ? <p className="text-xs text-gray-400">ምንም አባል የለም</p>
                    : group.members.map(m => (
                      <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-xs font-semibold text-blue-700">
                            {m.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{m.name}</p>
                            {m.student_id && <p className="text-xs text-gray-400">{m.student_id}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.pivot?.is_leader && <span className="badge-yellow text-xs">መሪ</span>}
                          {(isLeader || m.id===user.id) && (
                            <button onClick={() => handleRemoveMember(group.id, m.id)} className="text-red-400 hover:text-red-600 text-xs">አስወግድ</button>
                          )}
                        </div>
                      </div>
                    ))
                  }
                </div>

                {isLeader && avail.length > 0 && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <select className="input flex-1 text-sm" value={addMember[group.id]||''}
                      onChange={e => setAddMember({...addMember,[group.id]:e.target.value})}>
                      <option value="">ተማሪ ይምረጡ…</option>
                      {avail.map(s => <option key={s.id} value={s.id}>{s.name} {s.student_id?`(${s.student_id})`:''}</option>)}
                    </select>
                    <button onClick={() => handleAddMember(group.id)} className="btn-success btn-sm">ጨምር</button>
                  </div>
                )}

                {!myGroup && !isMember && (
                  <button className="btn-secondary btn-sm mt-2"
                    onClick={async () => {
                      try { await api.post(`/groups/${group.id}/members`,{user_id:user.id}); await fetchAll(); toast.success('ቡድን ተቀላቀሉ!') }
                      catch (err) { toast.error(err.response?.data?.message||'አልተሳካም') }
                    }}>
                    ቡድን ተቀላቀሉ
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Spinner() { return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/></div> }
