import React, { useState } from 'react'
import { useForm } from '../../hooks/useForm'
import { Global } from '../../helpers/Global'
import useAuth from '../../hooks/useAuth'

export const Login = () => {

  const { form, changed } = useForm({})
  const [logued, setLogued] = useState('not_sended')

  const { setAuth } = useAuth()

  const loginUser = async (e) => {
    e.preventDefault()

    // Datos que recogemos del form
    const userToLogin = form

    // Peticion al backend para comprobar datos
    const request = await fetch(Global.url + 'user/login', {
      method: 'POST',
      body: JSON.stringify(userToLogin),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const data = await request.json()

    if (data.status == 'success') {
      // Persistir datos en el navegador en caso de que sean correctos
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setLogued('login')

      // Setear datos en el auth
      setAuth(data.user)

      // Redirección
      setTimeout(() => {
        window.location.reload()
      }, 1000);

    } else {
      setLogued('error')
    }

  }

  return (
    <>
      <header className="content__header content__header--public">
        <h1 className="content__title">Login</h1>
      </header>

      <div className="content__posts">

        {logued == 'login' ?
          <strong className='alert alert-success'>Usuario identíficado correctamente</strong>
          : ''}

        {logued == 'error' ?
          <strong className='alert alert-error'>Error al indentificar al usuario</strong>
          : ''}

        <form className='form-login' onSubmit={loginUser}>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" name='email' onChange={changed} />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input type="password" name='password' onChange={changed} />
          </div>

          <input type="submit" value='Identifícate' className='btn btn-success' />

        </form>
      </div>
    </>
  )
}
