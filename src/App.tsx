import React, {useEffect, useState} from 'react'

import style from './App.module.css'
import {io} from "socket.io-client"
import {Button, Form} from "react-bootstrap";
import {IMessage} from "./types";
import axios from "axios";
import {Autocomplete, Stack, TextField} from "@mui/material";
import {API_URL} from "./config";



const MessageItem = (props: {message: IMessage}) => {
  const {message} = props
  const [cardIsOpen, setCardIsOpen] = useState(false)
  const messageReceiveDate = new Date(message.createdAt)
  return (
    <div className={`card ${style.message__card}`}>
      <div onClick={() => setCardIsOpen(prevState => !prevState)} className="card-header">
        {message.subject ? message.subject : "No subject"} {messageReceiveDate.toJSON().slice(0, 10)} {messageReceiveDate.getHours()}:{messageReceiveDate.getMinutes()}:{messageReceiveDate.getSeconds()}
      </div>
      <div className="card-body">
        <blockquote className="blockquote mb-0">
          {cardIsOpen ?  <p>{message.text}</p> : <p>{message.text.slice(0, 40)}...</p>}
          <footer className="card-footer bg-transparent border-success">from: {message.from}</footer>
        </blockquote>
      </div>
    </div>
  )
}


const Messages = (props: {messages: IMessage[]}) => {
  const {messages} = props
  return(
    <div className={style.message__root}>
      {
        messages.length ?

        messages.map(
          (message) => {
            return <MessageItem  key={message.id} message={message} />
          })
          : <h3>There are no messages yet</h3>
      }
    </div>
  )
}

function App() {
  const [errorMsg, setErrorMsg] = useState("")
  const [messages, setMessages] = useState<IMessage[]>([])
  const [username, setUsername] = useState("")
  const [usersHistory, setUsersHistory] = useState([])

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value)
  }

  const handleSendMessage = (e: any) => {
    e.preventDefault()
    const target = e.target
    axios.post(`${API_URL}/messages`, {
      to: target.recipient.value,
      from: username,
      text: target.message.value,
      subject: target.subject.value
    }).then(() => setErrorMsg("Message was send"))
      .catch(() =>{
        setErrorMsg("Something went wrong check recipient name and message content")
      }
    )
    if (!localStorage.getItem("usersHistory")) {
      localStorage.setItem("usersHistory", JSON.stringify([target.recipient.value, username]))
    } else {
      const localHistory = JSON.parse(localStorage.getItem("usersHistory") as string)
      if (!localHistory.includes(target.recipient.value)) {
        localStorage.setItem("usersHistory", JSON.stringify([target.recipient.value, ...localHistory]))
      }
    }
    setUsersHistory(JSON.parse(localStorage.getItem("usersHistory") as string))
  }

  useEffect(() => {
    localStorage.getItem("usersHistory") && setUsersHistory(JSON.parse(localStorage.getItem("usersHistory") as string))
  }, [usersHistory.length])

  useEffect(() => {
    const socket = io(`${API_URL}`)
    socket.on(`message__${username}`, (data) => {
      setMessages(prevState => {
        return [data, ...prevState.filter(message => message.id !== data.id)]
      })
    })
    if (username !== "") {
      axios.get(`${API_URL}/messages/${username}`).then(r => {
        setMessages(r.data)
      })
    }
    setErrorMsg('')
    if (username === "") {
      setMessages([])
    }
  }, [username])


  return (
    <>
      <div className={style.form__root}>
        <Form className={style.username__form}>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Write Your Username</Form.Label>
            <Form.Control onChange={handleUsernameChange} type="text" placeholder="Enter username" />
          </Form.Group>

        </Form>
      </div>
      <div className={style.form__root}>
        <Form onChange={() => setErrorMsg("")} onSubmit={handleSendMessage} className={style.message__form}>
          {errorMsg && <Form.Label>{errorMsg}</Form.Label>}
          <Form.Group className="mb-3">
            <Stack>
              <Autocomplete
                freeSolo
                id="free-solo-2-demo"
                disableClearable
                options={usersHistory.map((option) => option)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Enter message recipient name"
                    InputProps={{
                      ...params.InputProps,
                      name: "recipient",
                      type: 'input',
                      className: style.mui_input
                    }}
                  />
                )}
              />
            </Stack>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Control name="subject" type="text" placeholder="Enter message subject" />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Message text</Form.Label>
            <Form.Control name="message" as="textarea" rows={3} />
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>
      </div>

      <div className={style.messages__content}>
        {username ? <Messages messages={messages}/> : <h3>You have to write the user name</h3>}
      </div>
    </>
  )
}

export default App
