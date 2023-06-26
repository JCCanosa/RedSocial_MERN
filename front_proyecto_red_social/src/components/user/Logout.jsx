import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth'

export const Logout = () => {

    const { setAuth, setCounters } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        // Vaciar el localStorage
        localStorage.clear()

        // Setear estados globlales a vacio
        setAuth({})
        setCounters({})

        // Redirección a Login
        navigate('/login')

    }, [])

    return (
    <h1>Cerrando sesión...</h1>
    )
}
