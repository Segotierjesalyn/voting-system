const bcrypt = require('bcryptjs');

const password = 'admin123';
bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;
    console.log('Email: admin@votesecure.ph');
    console.log('Password: admin123');
    console.log('Hash:');
    console.log(hash);
});
