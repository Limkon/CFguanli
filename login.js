const fetch = require('node-fetch');
const fs = require('fs').promises;

const apiKey = '46ff5ad70aca8568480196b16e44358c48902';
const email = 'Kevlin2002@yahoo.com';
const zoneId = '8c2dc06d8469d0edcfee9e0718680a3b';
const targetName = 'yx.ssie.link';

async function getIPAddressesFromFile() {
  try {
    const data = await fs.readFile('iplist.txt', 'utf-8');
    return data.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error reading IP list file:', error);
    return [];
  }
}

async function deleteAllARecordsByName(name) {
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=A&name=${name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Email': email,
        'X-Auth-Key': apiKey
      }
    });

    const data = await response.json();
    for (const record of data.result) {
      const deleteResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${record.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Email': email,
          'X-Auth-Key': apiKey
        }
      });
      const deleteData = await deleteResponse.json();
      console.log(`Deleted A record with ID ${record.id}`);
    }
  } catch (error) {
    console.error('Error deleting A records:', error);
  }
}

async function addIPsToDNS(ipAddresses) {
  await deleteAllARecordsByName(targetName);

  for (const ip of ipAddresses) {
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;
    const body = {
      type: 'A',
      name: targetName,
      content: ip,
      ttl: 120,
      proxied: true
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Email': email,
          'X-Auth-Key': apiKey
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      console.log('Response:', data);
    } catch (error) {
      console.error('Error adding A record:', error);
    }
  }
}

async function startProcess() {
  const ipAddresses = await getIPAddressesFromFile();
  if (ipAddresses.length > 0) {
    await addIPsToDNS(ipAddresses);
  } else {
    console.log('No IP addresses found in the file.');
  }
}

startProcess();
