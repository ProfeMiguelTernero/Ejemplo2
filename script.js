const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcryptjs');
//Para subir las imagenes como blob
const multer = require('multer');
const upload = multer();


const app = express();
const port = 3000;

// MySQL Connection
const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'toor',
    database: 'red_social',
});

// si da error ejecutar: ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'toor';
connection.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL database');
});


//plantillas
app.set('view engine', 'ejs');

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret', // Cambia esta cadena secreta
    resave: false,
    saveUninitialized: true
}));

// Configuración para servir archivos estáticos
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.render('index',{ mensaje: '' });
});

app.get('/dashboard', (req, res) => {
   if (req.session.loggedIn) {
    res.render('dashboard', { username: req.session.username });
} else {
    res.render('error');
}
});

app.get('/registro',(req, res) => {
    res.render('registro');
});

app.get('/comentarios',(req, res) => {
    res.render('comentarios',{ username: req.session.username });
});

app.get('/publicaciones',(req, res) => {
    res.render('publicaciones',{ username: req.session.username });
});

app.get('/perfil',(req, res) => {
    const username = req.session.username;
    const mensaje = req.query.mensaje;
    // Consulta SQL para obtener los datos del perfil del usuario
    const sql = 'SELECT * FROM usuarios WHERE username = ?';
    connection.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Error al obtener datos del perfil:', err);
            res.status(500).send('Error al obtener datos del perfil');
            return;
        }

        // Comprobar si se encontraron resultados
        if (results.length > 0) {
            // Renderizar la plantilla 'perfil' con los datos del usuario
            //console.log(results[0].fecha_nacimiento); 
            res.render('perfil', { username, usuario: results[0], mensaje});
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    });
});


app.post('/register', async (req, res) => {
    //const url = req.body;
    const { name, apellido, username, password, fecha_nacimiento, phone } = req.body;
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertQuery ='INSERT INTO usuarios (nombre, apellido, username, contraseña, fecha_nacimiento, telefono) VALUES (?, ?, ?, ?, ?, ?)';
    const values = [name, apellido, username, hashedPassword, fecha_nacimiento, phone];
    // Ejecutar la consulta INSERT
    connection.query(insertQuery, values, function(error, results, fields) {
    if (error) {
        console.error('Error al insertar usuario:', error);
        return;
    }
    //console.log('Usuario insertado correctamente');
    res.render('index',{ mensaje: 'Usuario registrado' });
    });
});

// Ruta para servir la imagen de perfil
app.get('/imagen/:id', (req, res) => {
    //const userId = req.params.id;
    const username = req.session.username;

    // Consulta SQL para obtener la imagen de perfil del usuario
    const sql = 'SELECT foto_perfil FROM usuarios WHERE username = ?';

    connection.query(sql, [username], (err, results) => {
        if (err) {
            console.error('Error al obtener imagen de perfil:', err);
            res.status(500).send('Error al obtener imagen de perfil');
            return;
        }

        // Comprobar si se encontraron resultados
        if (results.length > 0) {
            // Obtener los datos de la imagen de perfil en formato BLOB
            const image = results[0].foto_perfil;

            // Verificar si hay datos en la columna de imagen
            if (image) {
                // Configurar el tipo de contenido de la respuesta
                res.contentType('image/jpeg'); // Cambiar a 'image/png' si es PNG

                // Enviar la imagen como respuesta
                res.send(image);
            } else {
                // Si no hay imagen de perfil, enviar una imagen de avatar predeterminada o un mensaje de error
                res.status(404).send('Imagen de perfil no encontrada');
            }
        } else {
            res.status(404).send('Usuario no encontrado');
        }
    });
});

app.post('/modifica_foto',upload.single('image'), async (req, res) => {
    const username = req.session.username;
    const image = req.file;
    if (!image) {
        res.redirect('/perfil?mensaje=' + encodeURIComponent('Error al obtener imagen de perfil'));
        return;
    }

    // Actualizar la foto de perfil del usuario en la base de datos
    const updateQuery = 'UPDATE usuarios SET foto_perfil = ? WHERE username = ?';
    const values = [image.buffer, username];

    // Ejecutar la consulta UPDATE
    connection.query(updateQuery, values, function(error, results, fields) {
        if (error) {
            res.redirect('/perfil?mensaje=' + encodeURIComponent('Error al actualizar la foto de perfil'));
            return;
        }
        
        res.redirect('perfil');

    });

});

app.get('/error', (req, res) => {
    res.render('error');
});

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.contraseña;
    const query = 'SELECT * FROM usuarios WHERE username = ?';
   
    connection.query(query, [username], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            // Verificar si la contraseña coincide utilizando bcrypt.compare()
            const validPassword = bcrypt.compare(password, results[0].contraseña);
                if (validPassword) {
                    req.session.loggedIn = true; // Establece la sesión como iniciada
                    req.session.username = username; // Guarda el nombre de usuario en la sesión
                    res.redirect('/dashboard'); // Redirige al usuario al panel de control (dashboard)
                } else {
                    res.render('index', { mensaje: 'Contraseña inválida' });
                }
   
        } else {
            res.render('index', { mensaje: 'Usuario no valido' }); // Redirige al usuario de vuelta al formulario de inicio de sesión con un mensaje de error
        }
    
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});



app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});