pragma solidity >= 0.5.0 <= 0.9.0;

contract Decentragram {
  string public name = "decentragram";

  // store image posts
  uint public id = 0;
  mapping(uint => Image) public images;   // similar to db
  
  struct Image {
    uint id;
    string hash;    // from ipfs
    string description;
    uint tipAmount;
    address payable author;
  }

  event ImageCreated(
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address payable author
  );

  event ImageTipped(
    uint id,
    string hash,
    string description,
    uint tipAmount,
    address payable author
  );

  // create image posts
  function upload(string memory _hash, string memory _description) public {
    // check hash
    require(bytes(_hash).length > 0);
    // check description not empty
    require(bytes(_description).length > 0);
    // check address not empty
    require(msg.sender != address(0x0));

    // increment id
    id++;
    // add image
    images[id] = Image(id, _hash, _description, 0, msg.sender);
    // trigger event
    emit ImageCreated(id, _hash, _description, 0, msg.sender);
  }

  // tip image posts
  function tip(uint _id) public payable {
    // check id
    require(_id > 0 && _id <= id);
    // fetch image
    Image memory _image = images[_id];
    // fetch author
    address payable _author = _image.author;
    // pay author in ETH
    address(_author).transfer(msg.value);
    // increment tip
    _image.tipAmount = _image.tipAmount + msg.value;
    // update image
    images[_id] = _image;
    // trigger event
    emit ImageTipped(_id, _image.hash, _image.description, _image.tipAmount, _author);
  }

}