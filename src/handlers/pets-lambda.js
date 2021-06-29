const BigCommerce = require('node-bigcommerce')


exports.petsLambdaHandler = async (event) => {
    try {
        const attributeName = process.env.CUSTOMER_ATTRIBUTE

        const bigCommerce = new BigCommerce({
            clientId: process.env.CLIENT_ID,
            accessToken: process.env.TOKEN,
            storeHash: process.env.STORE_HASH,
            responseType: 'json',
            apiVersion: 'v3'
        })

        const attributesData = await bigCommerce.get(`/customers/attributes?name=${attributeName}`)
        let attributeId

        if (!attributesData.data.length) {
            console.info(`No attribute named ${attributeName} found. Creating one now.`)
            const newAttributes = [
                {
                    name: attributeName,
                    type: 'string'
                }
            ]

            const newAttributesResponse = await bigCommerce.post(`/customers/attributes`, newAttributes)
            attributeId = newAttributesResponse.data[0].id
        } else {
            attributeId = attributesData.data[0].id
        }

        const customerId = event.requestContext.authorizer.bcCustomerId

        const body = [
            {
                attribute_id: attributeId,
                value: event.body,
                customer_id: parseInt(customerId)
            }
        ]

        const data = await bigCommerce.put(`/customers/attribute-values`, body)

        const response = {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
                "Access-Control-Allow-Origin": process.env.CORS_URL,
                "Access-Control-Allow-Methods": "PUT,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-Current-Customer, Accept"
            },
            body: JSON.stringify(data)
        };

        // All log statements are written to CloudWatch
        console.info(JSON.stringify(response));

        return response;
    } catch (err) {
        console.error(err)
        const response = {
            statusCode: 500,
            headers: {
                "content-type": "application/json",
                "Access-Control-Allow-Origin": process.env.CORS_URL,
                "Access-Control-Allow-Methods": "PUT,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, X-Current-Customer, Accept"
            },
            body: JSON.stringify({
                data: {
                    error: {
                        message: "An error occurred"
                    }
                }
            })
        }
    }
}
