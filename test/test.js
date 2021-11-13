const Decentragram = artifacts.require('./Decentragram.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Decentragram', ([deployer, author, tipper]) => {
  let decentragram

  before(async () => {
    decentragram = await Decentragram.deployed()
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await decentragram.address
      // checks that it is not blank
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async () => {
      const name = await decentragram.name()
      assert.equal(name, 'decentragram')
    })
  })

  describe('images', async () => {
    let result, id
    const hash = 'abcxyz'

    before(async () => {
      result = await decentragram.upload(hash, 'some image description', { from: author })
      id = await decentragram.id()
    })

    it('creates images', async () => {
      // SUCCESS
      assert.equal(id, 1)
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), id.toNumber(), 'id is correct')
      assert.equal(event.hash, hash, 'hash is correct')
      assert.equal(event.description, 'some image description', 'description is correct')
      assert.equal(event.tipAmount, 0, 'tip is correct')
      assert.equal(event.author, author, 'author is correct')

      // FAIL - Empty hash
      await decentragram.upload('', 'some image description', { from: author }).should.be.rejected;
      // FAIL - Empty description
      await decentragram.upload(hash, '', { from: author }).should.be.rejected;
    })

    // check struct
    it('lists images', async () => {
      const image = await decentragram.images(id)
      assert.equal(image.id.toNumber(), id.toNumber(), 'id is correct')
      assert.equal(image.hash, hash, 'hash is correct')
      assert.equal(image.description, 'some image description', 'description is correct')
      assert.equal(image.tipAmount, 0, 'tip is correct')
      assert.equal(image.author, author, 'author is correct')
    })

    // check tip amount
    it('allows user to tip images', async () => {
      // track author balance
      let oldAuthorBalance
      oldAuthorBalance = await web3.eth.getBalance(author)
      oldAuthorBalance = new web3.utils.BN(oldAuthorBalance)

      result = await decentragram.tip(id, { from: tipper, value: web3.utils.toWei('1', 'Ether') })

      // SUCCESS
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), id.toNumber(), 'id is correct')
      assert.equal(event.hash, hash, 'hash is correct')
      assert.equal(event.description, 'some image description', 'description is correct')
      assert.equal(event.tipAmount, '1000000000000000000', 'tip is correct')
      assert.equal(event.author, author, 'author is correct')

      // check author received funds
      let newAuthorBalance
      newAuthorBalance = await web3.eth.getBalance(author)
      newAuthorBalance = new web3.utils.BN(newAuthorBalance)

      let tipToOwner
      tipToOwner = web3.utils.toWei('1', 'Ether')
      tipToOwner = new web3.utils.BN(tipToOwner)

      const expectedBalance = oldAuthorBalance.add(tipToOwner)
      assert.equal(newAuthorBalance.toString(), expectedBalance.toString())

      // FAIL - Tries to tip invalid image
      await decentragram.tip(99, { from: tipper, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected;

    })
  })
})