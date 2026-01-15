const sequelize = require('./database');

async function resetAndSeed() {
    try {
        await sequelize.authenticate();
        console.log('✅ Terkoneksi ke database via Sequelize.');
        const queryInterface = sequelize.getQueryInterface();
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });
        console.log('🔓 Foreign Key Checks dimatikan.');
        const tables = await queryInterface.showAllTables();

        if (tables.length === 0) {
            console.log('⚠️ Tidak ada tabel ditemukan untuk dihapus.');
        } else {
            for (const tableName of tables) {

                if (tableName === 'SequelizeMeta') continue;

                await sequelize.query(`TRUNCATE TABLE ${tableName}`, { raw: true });
                console.log(`🗑️  Tabel '${tableName}' berhasil dikosongkan (Reset ID 1).`);
            }
        }
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });
        console.log('🔒 Foreign Key Checks diaktifkan kembali.');
        const insertQuery = `
            INSERT INTO Users (name, username, password, role, nim, createdAt, updatedAt) 
            VALUES (:name, :username, :password, :role, :nim, NOW(), NOW())
        `;

        await sequelize.query(insertQuery, {
            replacements: {
                name: 'Jass',
                username: 'Jass',
                password: '123',
                role: 'superadmin',
                nim: '2403311658'
            },
            type: sequelize.QueryTypes.INSERT
        });

        console.log('👤 User admin "Jass" berhasil dibuat!');
        console.log('\n✨ RESET DATABASE SELESAI! ✨');

    } catch (error) {
        console.error('❌ TERJADI ERROR:', error);
    } finally {
        await sequelize.close();
    }
}

resetAndSeed();