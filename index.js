const express = require('express');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const folderPath2 = path.join(__dirname, 'captcha_ImageServlet');

if (!fs.existsSync(folderPath2)) {
    fs.mkdirSync(folderPath2);
}


const folderPath = path.join(__dirname, 'captcha_images');

if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
}

const downloadCaptcha = async (index) => {
    const url = 'https://tracuunnt.gdt.gov.vn/tcnnt/captcha.png';
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
                secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
            }),
        });

        const filePath = path.join(folderPath, `captcha_${index}.png`);
        fs.writeFileSync(filePath, response.data);
        
        return filePath;
    } catch (error) {
        console.error(`Lỗi khi tải captcha ${index}:`, error.message);
        return null;
    }
};

const downloadCaptcha2 = async (index) => {
    const url = 'https://thuedientu.gdt.gov.vn/etaxnnt/servlet/ImageServlet';
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
                secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
            }),
        });

        const filePath = path.join(folderPath2, `captcha_${index}.png`);
        fs.writeFileSync(filePath, response.data);
        
        return filePath;
    } catch (error) {
        console.error(`Lỗi khi tải captcha ${index}:`, error.message);
        return null;
    }
};

const decodeCaptcha = async (filePath) => {
    try {
        let data = new FormData();
        data.append('file', fs.createReadStream(filePath));

        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://hddt-captcha-resolver.aonetek.vn/gen',
            headers: {
                ...data.getHeaders()
            },
            data: data
        };

        const response = await axios.request(config);
        const decodedText = response.data;

        return decodedText;
    } catch (error) {
        console.error(`Lỗi khi giải mã captcha:`, error.message);
        return null;
    }
};

app.get(`/download-captchas/:n`, async (req, res) => {
  const n = req.params.n;
    for (let i = 0; i < n; i++) {
        const filePath2 = await downloadCaptcha2(i);
        const filePath = await downloadCaptcha(i);

        if (filePath2&&filePath) {
            const decodedText = await decodeCaptcha(filePath);
            const decodedText2 = await decodeCaptcha(filePath2);

            if (decodedText&&decodedText2) {
                const newFilePath = path.join(folderPath, `${decodedText}.png`);
                const newFilePath2 = path.join(folderPath2, `${decodedText2}.png`);

                fs.renameSync(filePath, newFilePath);
                fs.renameSync(filePath2, newFilePath2);

                console.log(`Đã lưu captcha với tên: ${newFilePath}`);
                console.log(`Đã lưu captcha với tên: ${newFilePath2}`);

            }
        }
    }

    res.send('Đã tải và giải mã 2 file captcha thành công!');
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
