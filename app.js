document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('main section');
    const authButtons = document.querySelectorAll('.auth-btn');
    const blogContainer = document.querySelector('#blog-entries');
    const schoolContainer = document.querySelector('#school-entries');
    let isAuthenticated = false;

    // Mostrar la sección "Inicio" por defecto
    document.querySelector('#inicio').classList.add('active');

    // Función para mostrar la sección correspondiente al cambio de hash
    function showSection() {
        const hash = window.location.hash.substring(1);
        sections.forEach(section => {
            section.classList.remove('active');
        });
        if (hash) {
            document.getElementById(hash).classList.add('active');
            if (hash !== 'entry-view') {
                displayContent(hash);
            }
        } else {
            document.getElementById('inicio').classList.add('active');
        }
    }

    // Manejar cambios en el hash
    window.addEventListener('hashchange', showSection);

    // Mostrar la sección correspondiente al cargar la página
    showSection();

    authButtons.forEach(button => {
        button.addEventListener('click', () => {
            const section = button.getAttribute('data-section');
            const username = prompt('Ingrese su nombre de usuario:');
            const password = prompt('Ingrese su contraseña:');

            if (username === 'KikuriED' && password === 'KiKu13') {
                alert(`Acceso concedido para subir contenido a la sección: ${section}`);
                document.getElementById(`upload-${section}`).style.display = 'flex';
                isAuthenticated = true;
                document.body.classList.add('authenticated');
                displayContent(section);
            } else {
                alert('Acceso denegado. Usuario o contraseña incorrectos.');
            }
        });
    });

    document.querySelectorAll('.upload-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            if (!isAuthenticated) {
                showNotification('Acceso denegado. Solo el usuario autorizado puede subir contenido.');
                return;
            }
            const section = e.target.closest('div.upload-container').id.split('-')[1];
            const textarea = e.target.previousElementSibling.previousElementSibling;
            const fileInput = e.target.previousElementSibling;
            const content = textarea.value;

            const entries = JSON.parse(localStorage.getItem(section)) || [];
            const entry = { content, timestamp: Date.now(), files: [] };

            if (fileInput.files.length > 0) {
                Array.from(fileInput.files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        entry.files.push({ name: file.name, content: event.target.result });
                        if (entry.files.length === fileInput.files.length) {
                            entries.push(entry);
                            localStorage.setItem(section, JSON.stringify(entries));
                            showNotification('Contenido subido con éxito.');
                            textarea.value = '';
                            fileInput.value = '';
                            displayContent(section);
                        }
                    };
                    reader.readAsDataURL(file);
                });
            } else {
                entries.push(entry);
                localStorage.setItem(section, JSON.stringify(entries));
                showNotification('Contenido subido con éxito.');
                textarea.value = '';
                fileInput.value = '';
                displayContent(section);
            }
        });
    });

    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const uploadContainer = e.target.closest('.upload-container');
            const section = uploadContainer.id.split('-')[1];
            uploadContainer.style.display = 'none';
            if (isAuthenticated) {
                const entries = document.querySelectorAll(`#${section}-entries .entry`);
                entries.forEach(entry => {
                    entry.querySelector('.edit-btn').style.display = 'none';
                    entry.querySelector('.delete-btn').style.display = 'none';
                });
            }
        });
    });

    function displayContent(section) {
        const container = section === 'blog' ? blogContainer : schoolContainer;
        const entries = JSON.parse(localStorage.getItem(section)) || [];
        container.innerHTML = '';
        entries.forEach((entry, index) => {
            const entryDiv = document.createElement('div');
            entryDiv.className = 'entry';

            const title = document.createElement('h3');
            title.textContent = `Entrada ${new Date(entry.timestamp).toLocaleString()}`;
            const content = document.createElement('p');
            content.textContent = entry.content;

            entryDiv.appendChild(title);
            entryDiv.appendChild(content);

            if (entry.files && entry.files.length > 0) {
                entry.files.forEach(file => {
                    if (file.name.match(/\.(jpg|jpeg|png|gif)$/i)) {
                        const img = document.createElement('img');
                        img.src = file.content;
                        img.alt = file.name;
                        img.style.maxWidth = '100%';
                        img.style.height = 'auto';
                        entryDiv.appendChild(img);
                    } else {
                        const fileLink = document.createElement('a');
                        fileLink.href = file.content;
                        fileLink.download = file.name;
                        fileLink.textContent = `Descargar ${file.name}`;
                        entryDiv.appendChild(fileLink);
                    }
                });
            }

            if (isAuthenticated) {
                const editBtn = document.createElement('button');
                editBtn.textContent = 'Editar';
                editBtn.className = 'edit-btn';
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    editEntry(section, index);
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Eliminar';
                deleteBtn.className = 'delete-btn';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteEntry(section, index);
                });

                entryDiv.appendChild(editBtn);
                entryDiv.appendChild(deleteBtn);
            }

            entryDiv.addEventListener('click', () => {
                selectEntry(entryDiv, container);
            });

            container.appendChild(entryDiv);
        });
    }

    function selectEntry(entryDiv, container) {
        const allEntries = container.querySelectorAll('.entry');
        allEntries.forEach(entry => {
            entry.classList.remove('selected');
        });
        entryDiv.classList.add('selected');
        container.prepend(entryDiv);  // Mueve la entrada seleccionada al inicio del contenedor
        setTimeout(() => {
            const headerOffset = 100; // Ajuste el valor de desplazamiento para subir más la entrada
            const elementPosition = entryDiv.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }, 100); // Delay de 100 ms para asegurar que el desplazamiento ocurra después del movimiento
    }

    function editEntry(section, index) {
        const entries = JSON.parse(localStorage.getItem(section)) || [];
        const entry = entries[index];
        const newContent = prompt('Edita el contenido:', entry.content);
        if (newContent !== null) {
            entry.content = newContent;
            localStorage.setItem(section, JSON.stringify(entries));
            displayContent(section);
            showNotification('Entrada editada con éxito.');
        }
    }

    function deleteEntry(section, index) {
        const entries = JSON.parse(localStorage.getItem(section)) || [];
        if (confirm('¿Estás seguro de que deseas eliminar esta entrada?')) {
            entries.splice(index, 1);
            localStorage.setItem(section, JSON.stringify(entries));
            displayContent(section);
            showNotification('Entrada eliminada con éxito.');
        }
    }

    function showNotification(message) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.style.display = 'block';
        notification.style.opacity = 1;
        notification.style.bottom = '20px';

        setTimeout(() => {
            notification.style.opacity = 0;
            notification.style.bottom = '10px';
            setTimeout(() => {
                notification.style.display = 'none';
            }, 500);
        }, 3000);
    }

    // Inicializar el evento 'click' en las entradas existentes
    const entries = document.querySelectorAll('.entry');
    entries.forEach(entry => {
        entry.addEventListener('click', () => {
            selectEntry(entry, entry.parentNode);
        });
    });
});
