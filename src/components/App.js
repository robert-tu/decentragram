import React, { Component } from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import './App.css';
import Decentragram from '../abis/Decentragram.json'
import Navbar from './Navbar'
import Main from './Main'

// declare ipfs connection
const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })

class App extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }
  
  // import Web3 from MetaMask
  async loadWeb3() {
    if(window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      window.alert("Non-ETH browser detected.")
    }
  }

  // get blockchain data
  async loadBlockchainData() {
    const web3 = window.web3
    // load account
    const accounts = await web3.eth.getAccounts()
    this.setState({ account: accounts[0] })

    // get network information from JSON
    const networkId = await web3.eth.net.getId()
    const networkData = Decentragram.networks[networkId]
    if(networkData) {
      const decentragram = new web3.eth.Contract(Decentragram.abi, networkData.address)
      this.setState({ decentragram })
      // get image id from contract
      const imageId = await decentragram.methods.id().call()
      this.setState({ imageId })

      // load images
      for(var i = 1; i <= imageId; i++) {
        const image = await decentragram.methods.images(i).call()
        this.setState({ images: [...this.state.images, image] })
      }

      // sort images by tip amount
      this.setState({ images: this.state.images.sort((a,b) => b.tipAmount - a.tipAmount) })
      this.setState({ loading: false })
    } else {
      window.alert('Contract is not deployed to this network.')
    }
  }

  // process file for upload
  captureFile = event => {
    // submit
    event.preventDefault()
    // read file
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    // convert for ipfs input
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) })
      console.log('buffer', this.state.buffer)
    }
  }

  uploadImage = description => {
    console.log("Uploading file to ipfs...")
    // add file to ipfs
    ipfs.add(this.state.buffer, (error, result) => {
      console.log('Ipfs result', result)
      if(error) {
        console.error(error)
        return
      }

      // load file into blockchain
      this.setState({ loading: true })
      this.state.decentragram.methods.upload(result[0].hash, description)
                                     .send({ from: this.state.account })
                                     .on('transactionHash', (hash) => {
        this.setState({ loading: false })
      })
    })
  }

  tipImageOwner = (id, tipAmount) => {
    this.setState({ loading: true })
    this.state.decentragram.methods.tip(id).send( { from: this.state.account, value: tipAmount }).on('transactionHash', (hash) => {
      this.setState({ loading: false })
    })
  }


  constructor(props) {
    super(props)
    this.state = {
      account: '',
      decentragram: null,
      images: [],
      loading: true
    }
  }

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        { this.state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
            images={this.state.images}
            captureFile={this.captureFile}
            uploadImage={this.uploadImage}
            tipImageOwner={this.tipImageOwner}
            />
          }
        }
      </div>
    );
  }
}

export default App;