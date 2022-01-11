import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Button from 'react-bootstrap/Button'
import { useState } from 'react'
import Web3 from 'web3'
import Dashboard from '../components/Dashboard'

export default function Home() {
  const [address, setAddress] = useState()
  const [web3, setWeb3] = useState(new Web3())
  const [loggedIn, setLoggedIn] = useState(false)

  const login = () => {
    ethereum
      .request({ method: 'eth_requestAccounts' })
      .then((accounts) => {
        setAddress(web3.utils.toChecksumAddress(accounts[0]))
        let w3 = new Web3(ethereum)
        setWeb3(w3)

        setLoggedIn(true)
      })
      .catch((err) => console.log(err))
  }

  return (
    <div className="main">
      <Head>
        <title>MCP NFT Demo</title>
        <meta name="description" content="DEMO: NFT" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {loggedIn ? (
        <Dashboard web3={web3} address={address} />
      ) : (
        <Button
          className="connect-btn"
          variant="primary"
          size="lg"
          active
          onClick={() => {
            login()
          }}
        >
          {' '}
          Connect to Metamask
        </Button>
      )}
    </div>
  )
}
