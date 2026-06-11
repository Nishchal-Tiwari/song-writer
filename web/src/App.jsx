import { useState } from 'react'
import SongList from './pages/SongList'
import CreateSong from './pages/CreateSong'
import DefineRules from './pages/DefineRules'
import SongChat from './pages/SongChat'

function App() {
  const [view, setView] = useState('list')
  const [activeSongId, setActiveSongId] = useState(null)

  const openSong = (songId, targetView) => {
    setActiveSongId(songId)
    setView(targetView)
  }

  if (view === 'create') {
    return (
      <CreateSong
        onCreated={(songId) => openSong(songId, 'rules')}
        onCancel={() => setView('list')}
      />
    )
  }

  if (view === 'rules' && activeSongId) {
    return (
      <DefineRules
        songId={activeSongId}
        onComplete={(songId) => openSong(songId, 'chat')}
        onCancel={() => setView('list')}
      />
    )
  }

  if (view === 'chat' && activeSongId) {
    return (
      <SongChat songId={activeSongId} onBack={() => setView('list')} />
    )
  }

  return (
    <SongList
      onCreate={() => setView('create')}
      onOpen={openSong}
    />
  )
}

export default App
