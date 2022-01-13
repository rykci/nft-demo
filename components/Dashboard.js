import React, { useState, useEffect } from 'react'
import {
  getTasksList,
  getTxHash,
  getFileDetails,
  uploadFile,
  postMintInfo,
} from '../pages/api/uploadedFiles'
import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import nftContractAbi from '../abi/DatabaseMinter.json'

export default function Dashboard({ web3, address }) {
  const [files, setFiles] = useState([])
  const [minting, setMinting] = useState(false)
  const [isLoading, setLoading] = useState(false)
  const [nftContract, setMintContract] = useState()
  const [viewAddress, setViewAddress] = useState('')
  const [nftHash, setNftHash] = useState('')
  const [tokenId, setTokenId] = useState(0)
  const [openseaModal, setOpenseaModal] = useState(false)
  const [payloadCid, setPayloadCid] = useState('')
  const [nft, setNft] = useState({
    name: '',
    description: '',
    image: '',
    tx_hash: '',
    attributes: [{ trait_type: 'Size', value: '' }],
  })

  useEffect(async () => {
    // fetch taskLists api
    const taskList = await getTasksList(address)
    setFiles(taskList.data)

    // load mint contract
    setMintContract(
      new web3.eth.Contract(
        nftContractAbi,
        process.env.NEXT_PUBLIC_MINT_CONTRACT,
        { from: address, gas: 9999999 },
      ),
    )
  }, [])

  // handles change in modal form
  const handleNftChange = (e) => {
    setNft({ ...nft, [e.target.id]: e.target.value })
  }

  // when user clicks 'MINT' button, sets up some nft values
  const prepNft = async (file) => {
    const res = await getFileDetails(file.payload_cid)
    const ipfs_url = res.data.deal.ipfs_url

    const hashRes = await getTxHash(file.payload_cid)
    const txHash = hashRes.data.tx_hash

    setNft({
      name: file.file_name,
      description: '',
      image: ipfs_url,
      tx_hash: txHash,
      attributes: [{ trait_type: 'Size', value: parseInt(file.file_size) }],
    })

    setPayloadCid(file.payload_cid)
  }

  // when user clicks 'VIEW' button, set up hash and opensea link
  const prepOpensea = (tx_hash, id, address) => {
    setNftHash(tx_hash)
    setTokenId(id)
    setViewAddress(address)
    setOpenseaModal(true)
  }

  // when user clicks 'MINT NFT'
  const handleMint = async () => {
    setLoading(true)

    // nft object -> json file blob
    const fileBlob = new Blob([JSON.stringify(nft)], {
      type: 'application/json',
    })

    // mcp upload api
    const metadataUploadResponse = await uploadFile(
      `${nft.name}.json`,
      fileBlob,
      address,
    )

    // get the ipfs_url from the response
    const nftUrl = metadataUploadResponse.data.ipfs_url

    // mint nft
    try {
      const transaction = await nftContract.methods
        .mintData(address, nftUrl)
        .send()

      // get nft token id
      const tokenID = await nftContract.methods.totalSupply().call()

      await postMintInfo(
        payloadCid,
        transaction.transactionHash,
        tokenID,
        nftContract._address,
      )

      setLoading(false)
      setMinting(false)
      // opensea modal will show tx_hash and opensea link
      prepOpensea(transaction.transactionHash, tokenID, nftContract._address)
    } catch (err) {
      console.error(err)
      console.log('minting error')
      setLoading(false)
      setMinting(false)
    }
  }

  return (
    <div>
      <button onClick={async () => console.log()}>PRINT</button>
      <div className="account-text">ACCOUNT: {address}</div>
      <div className="container">
        <Table className="table" striped bordered responsive="sm">
          <thead>
            <tr>
              <th>FILE NAME</th>
              <th>FILE SIZE</th>
              <th>STATUS</th>
              <th>PIN STATUS</th>
              <th className="idColumn">DATA CID</th>
              <th>STORAGE PROVIDER</th>
              <th>CREATE TIME</th>
              <th>PAYMENT</th>
              <th>MINT</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              return (
                <tr key={file.payload_cid}>
                  <td>{file.file_name}</td>
                  <td>{file.size}</td>
                  <td>
                    <Button
                      className="status-text"
                      variant={file.status == 'Pending' ? 'warning' : 'primary'}
                    >
                      {file.status}
                    </Button>
                  </td>
                  <td>
                    <Button variant="outline-warning">{file.pin_status}</Button>
                  </td>
                  <td>{file.payload_cid}</td>
                  <td>{file.miner_fid || '-'}</td>
                  <td>{file.create_at}</td>
                  <td>
                    {file.status == 'Pending' ? (
                      <Button>PAY</Button>
                    ) : (
                      <Button disabled>PAID</Button>
                    )}
                  </td>
                  <td>
                    {file.status != 'Pending' ? (
                      file.token_id ? (
                        <Button
                          variant="primary"
                          onClick={async () => {
                            prepOpensea(
                              file.nft_tx_hash,
                              file.token_id,
                              file.mint_address,
                            )
                          }}
                        >
                          VIEW
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          onClick={async () => {
                            await prepNft(file)
                            setMinting(true)
                          }}
                        >
                          MINT
                        </Button>
                      )
                    ) : (
                      <></>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      </div>
      <Modal show={minting} onHide={() => setMinting(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Your NFT</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="name">
              <Form.Label>NFT Name</Form.Label>
              <Form.Control
                type="text"
                value={nft.name}
                onChange={(e) => handleNftChange(e)}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="description">
              <Form.Label>NFT Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={nft.description}
                onChange={(e) => handleNftChange(e)}
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formTxHash">
              <Form.Label>IPFS URL</Form.Label>
              <Form.Control type="text" readOnly value={nft.image} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formTxHash">
              <Form.Label>Payment Transaction Hash</Form.Label>
              <Form.Control type="text" readOnly value={nft.tx_hash} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="formTxHash">
              <Form.Label>File Size</Form.Label>
              <Form.Control
                type="text"
                readOnly
                value={nft.attributes[0].value}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMinting(false)}>
            Back
          </Button>
          <Button
            variant="primary"
            disabled={isLoading}
            onClick={!isLoading ? handleMint : null}
          >
            {isLoading ? 'Minting…' : 'Mint NFT'}
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={openseaModal} onHide={() => setOpenseaModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>View Your NFT</Modal.Title>
        </Modal.Header>
        <Modal.Body className="opensea-modal">
          Your NFT has been minted! You can view the transaction here:
          <div className="hash-link">
            <a
              href={`https://mumbai.polygonscan.com/tx/${nftHash}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {nftHash}
            </a>
          </div>
          <a
            href={`https://testnets.opensea.io/assets/mumbai/${viewAddress}/${tokenId}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            {'Click here to view your NFT on OpenSea'}
          </a>
          <div>Note: The NFT will take some time to load on Opensea.</div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setOpenseaModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
