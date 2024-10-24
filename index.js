import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';
import https from 'https';
import crypto from 'crypto';

const __dirname = path.resolve();

const folderPath2 = path.join(__dirname, 'captcha_ImageServlet');

if (!fs.existsSync(folderPath2)) {
    fs.mkdirSync(folderPath2);
}

const folderPath = path.join(__dirname, 'captcha_images');

if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
}

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

        const decodedText = await decodeCaptcha(filePath);

        if (decodedText) {
            const newFilePath = path.join(folderPath, `${decodedText}.png`);
            if (fs.existsSync(newFilePath)) {
                fs.renameSync(filePath, path.join(folderPath, `${decodedText}_${index}.png`));
            } else {
                fs.renameSync(filePath, newFilePath);
            }
        } else {
            console.log(`Không thể giải mã captcha cho file: ${filePath}`);
        }
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

        const decodedText = await decodeCaptcha(filePath);

        if (decodedText) {
            const newFilePath = path.join(folderPath2, `${decodedText}.png`);
            if (fs.existsSync(newFilePath)) {
                fs.renameSync(filePath, path.join(folderPath2, `${decodedText}_${index}.png`));
            } else {
                fs.renameSync(filePath, newFilePath);
            }
        } else {
            console.log(`Không thể giải mã captcha cho file: ${filePath}`);
        }
    } catch (error) {
        console.error(`Lỗi khi tải captcha ${index}:`, error.message);
        return null;
    }
};

const run = async () => {
    const promises = [];

    for (let i = 0; i < 3; i++) {
        promises.push(downloadCaptcha(i));
        promises.push(downloadCaptcha2(i));
    }

    await Promise.all(promises);
};

run();
