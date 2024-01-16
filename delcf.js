// Import the required modules.
const fetch = require('node-fetch');
const fs = require('fs').promises;

// Define the Cloudflare API key, email, and zone ID.
const apiKey = 'YDSt9IyDDN4YOw5Phdyi1m_BAzcvToBTkuRsZ18W';
const email = 'Kevlin2002@yahoo.com';
const zoneId = '19d7a265c5f903edf66369654314a459';

// Define the target domain name.
const targetDomain = '*.educ.cloudns.biz';

// Function to get a list of IP addresses from a text file.
async function getIPAddressesFromFile() {
  try {
    // Read the IP list file and split it into an array of IP addresses.
    const data = await fs.readFile('iplist.txt', 'utf-8');
    return data.split('\n').filter(Boolean);
  } catch (error) {
    console.error('Error reading IP list file:', error);
    return [];
  }
}

// Function to delete all A records for a given domain name.
async function deleteAllARecordsByName(name) {
  try {
    // Make a GET request to retrieve all A records for the given domain name.
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=A&name=${name}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Email': email,
        'X-Auth-Key': apiKey
      }
    });

    // Parse the response body as JSON.
    const data = await response.json();

    // Iterate over the A records and delete each one.
    for (const record of data.result) {
      const deleteResponse = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${record.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Email': email,
          'X-Auth-Key': apiKey
        }
      });

      // Parse the delete response body as JSON.
      const deleteData = await deleteResponse.json();

      console.log(`Deleted A record with ID ${record.id}`);
    }
  } catch (error) {
    console.error('Error deleting A records:', error);
  }
}

// Function to add a list of IP addresses to the DNS records for a given domain name.
async function addIPsToDNS(ipAddresses) {
  // Delete all existing A records for the target domain name.
  await deleteAllARecordsByName(targetDomain);

  // Iterate over the IP addresses and add each one as an A record.
  for (const ip of ipAddresses) {
    const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;
    const body = {
      type: 'A',
      name: targetDomain,
      content: ip,
      ttl: 120,
      proxied: true
    };

    try {
      // Make a POST request to create a new A record.
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Email': email,
          'X-Auth-Key': apiKey
        },
        body: JSON.stringify(body)
      });

      // Parse the response body as JSON.
      const data = await response.json();

      console.log('Response:', data);
    } catch (error) {
      console.error('Error adding A record:', error);
    }
  }
}

// Function to start the process of updating the DNS records.
async function startProcess() {
  // Get a list of IP addresses from the file.
  const ipAddresses = await getIPAddressesFromFile();

  // If there are IP addresses in the file, update the DNS records.
  if (ipAddresses.length > 0) {
    await addIPsToDNS(ipAddresses);
  } else {
    console.log('No IP addresses found in the file.');
  }
}

// Start the process.
startProcess();
