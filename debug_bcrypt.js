const bcrypt = require('bcryptjs');

const testHash = '$2b$10$dqO1a0hfFf6yv96F8CPI2O/5M4hmX3FjxjrctzxBbOCm/8SvGstuu'; // Current hash in DB for 554433
const userEnteredPin = '1234'; // Replace with the ACTUAL pin you used if different

async function test() {
    const match = await bcrypt.compare(userEnteredPin, testHash);
    console.log(`PIN: ${userEnteredPin}`);
    console.log(`Hash in DB: ${testHash}`);
    console.log(`Matches? ${match}`);
}

test();
