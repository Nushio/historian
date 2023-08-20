# Historian

**Description**: Stores document changes in a subcollection, alongside a timestamp and a deleteAfter field, so that in combination with Firestore TTL, you can automatically delete these changes documents after a chosen period of time.


**Details**: Use this extension to automatically store changes to your firestore collections in a separate subcollection. 

You can configure this extension with the subcollection name. The default subcollection is named historian.

You can configure this extension with the period of days the data will be stored. The default is 30 days. This requires configuration that this extension does not handle automatically: Setting the Firestore TTL to delete documents. 

![Standard Screenshot with Changes](https://github.com/nushio/historian/blob/main/Screenshot.png?raw=true)


#### Additional setup

After installing this extension and updating at least one document, so that the extension triggers and creates your historian subcollection, head to [Google's Cloud Console](https://console.cloud.google.com/firestore/databases/-default-/ttl) and configure your Time-to-live (TTL) Policy. 

Enter the collection group name of the subcollection, and the deleteAfter field as the timestamp field. 

Data is typically deleted within 72 hours after its expiration date.

#### Billing
To install an extension, your project must be on the [Blaze (pay as you go) plan](https://firebase.google.com/pricing)
 
- This extension uses other Firebase and Google Cloud Platform services, which have associated charges if you exceed the service’s no-cost tier:
  - Cloud Firestore
  - Cloud Functions (Node.js 16+ runtime. [See FAQs](https://firebase.google.com/support/faq#extensions-pricing))


**Configuration Parameters:**

* Your Collection Name: Which collection will be monitored for changes.

* Your SubCollection Name: The name of the subcollection where changes will be stored.

* Your TTL Period: How many days should the data be stored for? This requires configuration that this extension does not handle automatically: Setting the Firestore TTL to delete documents.


**Cloud Functions:**

* **processEvent:** Listens for changes to the collection specified, and writes the changelog accordingly.



**Access Required**:



This extension will operate with the following project IAM roles:

* datastore.owner (Reason: Allows the extension to delete (user) data from Cloud Firestore.)
