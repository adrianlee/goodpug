var Response = function (buffer) {

    this.size = buffer.readInt32LE(0);
    this.id = buffer.readInt32LE(4);
    this.type = Response[buffer.readInt32LE(8)];
    this.body = buffer.toString('ascii', 12, buffer.length - 2);
}

Response[0x03] = 'SERVERDATA_AUTH';
Response[0x02] = 'SERVERDATA_AUTH_RESPONSE';
Response[0x00] = 'SERVERDATA_RESPONSE_VALUE';

module.exports = Response;