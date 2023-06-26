import React, { useEffect, useState } from 'react'
import { Global } from '../../helpers/Global'
import { UserList } from '../user/UserList'
import { useParams } from 'react-router-dom'
import { GetProfile } from '../../helpers/GetProfile'

export const Followers = () => {

  const [users, setUsers] = useState([])
  const [page, setPage] = useState(1)
  const [more, setMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState([])
  const [userProfile, setUserProfile] = useState({})

  const params = useParams()

  useEffect(() => {
    getUsers(1)
    GetProfile(params.userId, setUserProfile)
  }, [])

  const getUsers = async (nextPage = 1) => {
    setLoading(true)

    // Obtener userId de la url
    const userId = params.userId

    // Peticion para recoger usuarios
    const request = await fetch(Global.url + 'follow/followers/' + userId + '/' + nextPage, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': localStorage.getItem('token')
      }
    })

    const data = await request.json()
    
    // Recorrer follows y obtener followed (datos usuarios)
    let cleanUsers = []

    data.follows.forEach(follow => {
      cleanUsers = [...cleanUsers, follow.user]
    })

    data.follows = cleanUsers
    
    if (data.follows && data.status == 'success') {
      let newUsers = data.follows
      
      if (users.length >= 1) {
        newUsers = [...users, ...data.follows]
      }
      
      setUsers(newUsers)
      setFollowing(data.following)
      setLoading(false)
    }

    // Paginación
    if (users.length >= data.total) {
      setMore(false)
    }
  }

  return (
    <>
      <header className="content__header">
        <h1 className="content__title">Seguidores de {userProfile.name} {userProfile.surname} </h1>
        <button className="content__button">Mostrar nuevas</button>
      </header>

      <UserList users={users}
        getUsers={getUsers}
        following={following}
        setFollowing={setFollowing}
        page={page}
        setPage={setPage}
        more={more}
        loading={loading}
      />
      <br />
    </>
  )
}

