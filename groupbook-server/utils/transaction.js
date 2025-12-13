/*
=======================================================================================================================================
Transaction Utility
=======================================================================================================================================
Purpose: Provides a wrapper for database transactions to ensure atomic operations.
         Automatically handles BEGIN, COMMIT, and ROLLBACK.
Usage:
  const { withTransaction } = require('../utils/transaction');

  const result = await withTransaction(async (client) => {
    await client.query('INSERT INTO ...', [...]);
    await client.query('UPDATE ...', [...]);
    return { success: true };
  });
=======================================================================================================================================
*/

const { pool } = require('../database');

/*
 * withTransaction - Executes a callback function within a database transaction
 * @param {Function} callback - Async function that receives a client and performs queries
 * @returns {*} - Returns whatever the callback returns
 * @throws {Error} - Rolls back transaction and rethrows any errors
 */
const withTransaction = async (callback) => {
  // Get a client from the pool for this transaction
  const client = await pool.connect();

  try {
    // Start the transaction
    await client.query('BEGIN');

    // Execute the callback with the client
    const result = await callback(client);

    // If we get here without errors, commit the transaction
    await client.query('COMMIT');

    return result;
  } catch (error) {
    // Something went wrong - rollback all changes
    await client.query('ROLLBACK');
    throw error;
  } finally {
    // Always release the client back to the pool
    client.release();
  }
};

module.exports = { withTransaction };
