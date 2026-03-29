// auth.js
const SUPABASE_URL = 'https://xsciqtvfknxjpsdgytsv.supabase.co'; // Reemplaza con tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzY2lxdHZma254anBzZGd5dHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NTQyNjgsImV4cCI6MjA5MDMzMDI2OH0.9GG43QuwzXYO_D6hDX1Ga0zZISgCJzJS3Wf_09lcmXk'; // Reemplaza con tu clave anónima

let currentUser = null;
let _supabaseClient = null;

if (typeof window.supabase !== 'undefined') {
    _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log("Supabase initialized");
}

async function registerUser(username, password) {
    try {
        if (!_supabaseClient) {
            alert("Supabase no conectado");
            return { success: false, error: 'Supabase no configurado' };
        }
        
        console.log("Intentando registrar:", username);
        
        const hashedPassword = btoa(password);

        const { data, error } = await _supabaseClient
            .from('users')
            .insert([{ username: username, password: hashedPassword }])
            .select();

        if (error) {
            console.error("Error Supabase:", error);
            alert("Error: " + error.message);
            throw error;
        }

        if (data && data.length > 0) {
            currentUser = data[0];
            localStorage.setItem('cloud_username', username);
            localStorage.setItem('cloud_logged_in', 'true');
            alert("Usuario registrado: " + username);
            return { success: true, user: currentUser };
        } else {
            alert("No se pudo crear el usuario");
            return { success: false, error: 'No se pudo crear' };
        }
    } catch (error) {
        console.error('Error en registro:', error);
        alert("Error: " + error.message);
        return { success: false, error: error.message };
    }
}

async function loginUser(username, password) {
    try {
        if (!_supabaseClient) {
            alert("Supabase no conectado");
            return { success: false, error: 'Supabase no configurado' };
        }
        
        console.log("Intentando login:", username);
        
        const hashedPassword = btoa(password);

        const { data, error } = await _supabaseClient
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', hashedPassword);

        if (error) {
            console.error("Error Supabase:", error);
            alert("Error: " + error.message);
            throw error;
        }

        if (data && data.length > 0) {
            currentUser = data[0];
            localStorage.setItem('cloud_username', username);
            localStorage.setItem('cloud_logged_in', 'true');
            alert("Login exitoso: " + username);
            return { success: true, user: currentUser };
        } else {
            alert("Usuario o contraseña incorrectos");
            return { success: false, error: 'Usuario o contraseña incorrectos' };
        }
    } catch (error) {
        console.error('Error en login:', error);
        alert("Error: " + error.message);
        return { success: false, error: error.message };
    }
}

async function saveRankingData(data) {
    if (!currentUser) {
        console.log("No user logged in");
        return { success: false, error: 'No hay usuario autenticado' };
    }
    if (!_supabaseClient) return { success: false, error: 'Supabase no configurado' };

    try {
        console.log("Guardando datos para:", currentUser.username);
        
        // Primero verificar si ya existe
        const { data: existing } = await _supabaseClient
            .from('user_rankings')
            .select('id')
            .eq('user_id', currentUser.id);

        const rankingData = {
            user_id: currentUser.id,
            sorted_index_list: data.sortedIndexList,
            record_data_list: data.recordDataList,
            parent_index_list: data.parentIndexList,
            left_index: data.leftIndex,
            left_inner_index: data.leftInnerIndex,
            right_index: data.rightIndex,
            right_inner_index: data.rightInnerIndex,
            battle_no: data.battleNo,
            sorted_no: data.sortedNo,
            pointer: data.pointer,
            total_battles: data.totalBattles
        };

        let result;
        if (existing && existing.length > 0) {
            // Actualizar
            result = await _supabaseClient
                .from('user_rankings')
                .update(rankingData)
                .eq('user_id', currentUser.id);
            console.log("Actualizado registro existente");
        } else {
            // Insertar nuevo
            result = await _supabaseClient
                .from('user_rankings')
                .insert([rankingData]);
            console.log("Creado nuevo registro");
        }

        if (result.error) throw result.error;
        alert("Datos guardados en la nube!");
        return { success: true };
    } catch (error) {
        console.error('Error al guardar:', error);
        alert("Error al guardar: " + error.message);
        return { success: false, error: error.message };
    }
}

async function loadRankingData() {
    if (!currentUser) {
        return { success: false, error: 'No hay usuario autenticado' };
    }
    if (!_supabaseClient) return { success: false, error: 'Supabase no configurado' };

    try {
        console.log("Cargando datos para usuario:", currentUser.username);
        
        // Usar maybeSingle() en lugar de single() para evitar error si no hay datos
        const { data, error } = await _supabaseClient
            .from('user_rankings')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle();

        if (error) throw error;
        
        if (!data) {
            console.log("No se encontraron datos para el usuario");
            return { success: false, error: 'No hay datos guardados. Juega algunas batallas primero.' };
        }

        console.log("Datos encontrados:", data);
        
        return { 
            success: true, 
            data: {
                sortedIndexList: data.sorted_index_list,
                recordDataList: data.record_data_list,
                parentIndexList: data.parent_index_list,
                leftIndex: data.left_index,
                leftInnerIndex: data.left_inner_index,
                rightIndex: data.right_index,
                rightInnerIndex: data.right_inner_index,
                battleNo: data.battle_no,
                sortedNo: data.sorted_no,
                pointer: data.pointer,
                totalBattles: data.total_battles
            }
        };
    } catch (error) {
        console.error('Error al cargar:', error);
        return { success: false, error: error.message };
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem('cloud_username');
    localStorage.removeItem('cloud_logged_in');
    alert("Logged out");
    
    // Actualizar UI sin recargar
    if (typeof configureLoadButton === 'function') {
        configureLoadButton();
    }
    
    // Limpiar display de usuario
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) userDisplay.remove();
}

function getCurrentUser() {
    return currentUser;
}
