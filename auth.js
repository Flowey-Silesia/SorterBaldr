// auth.js
const SUPABASE_URL = 'https://xsciqtvfknxjpsdgytsv.supabase.co'; // Reemplaza con tu URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzY2lxdHZma254anBzZGd5dHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NTQyNjgsImV4cCI6MjA5MDMzMDI2OH0.9GG43QuwzXYO_D6hDX1Ga0zZISgCJzJS3Wf_09lcmXk'; // Reemplaza con tu clave anónima

let currentUser = null;

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Función para registrar usuario
async function registerUser(username, password) {
  try {
    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      return { success: false, error: 'El usuario ya existe' };
    }

    // Hash simple de contraseña (en producción usar bcrypt, pero para este caso simple está bien)
    const hashedPassword = btoa(password); // Base64 encoding (simple)

    // Crear nuevo usuario
    const { data, error } = await supabase
      .from('users')
      .insert([
        { 
          username: username, 
          password: hashedPassword 
        }
      ])
      .select()
      .single();

    if (error) throw error;

    currentUser = data;
    return { success: true, user: data };
  } catch (error) {
    console.error('Error en registro:', error);
    return { success: false, error: error.message };
  }
}

// Función para login
async function loginUser(username, password) {
  try {
    const hashedPassword = btoa(password);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', hashedPassword)
      .single();

    if (error || !data) {
      return { success: false, error: 'Usuario o contraseña incorrectos' };
    }

    currentUser = data;
    return { success: true, user: data };
  } catch (error) {
    console.error('Error en login:', error);
    return { success: false, error: error.message };
  }
}

// Función para guardar datos del ranking
async function saveRankingData(data) {
  if (!currentUser) {
    return { success: false, error: 'No hay usuario autenticado' };
  }

  try {
    // Verificar si ya existe un registro para este usuario
    const { data: existingData, error: checkError } = await supabase
      .from('user_rankings')
      .select('id')
      .eq('user_id', currentUser.id)
      .single();

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
    if (existingData) {
      // Actualizar registro existente
      result = await supabase
        .from('user_rankings')
        .update(rankingData)
        .eq('user_id', currentUser.id);
    } else {
      // Crear nuevo registro
      result = await supabase
        .from('user_rankings')
        .insert([rankingData]);
    }

    if (result.error) throw result.error;
    return { success: true };
  } catch (error) {
    console.error('Error al guardar:', error);
    return { success: false, error: error.message };
  }
}

// Función para cargar datos del ranking
async function loadRankingData() {
  if (!currentUser) {
    return { success: false, error: 'No hay usuario autenticado' };
  }

  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (error) throw error;
    
    if (!data) {
      return { success: false, error: 'No hay datos guardados para este usuario' };
    }

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

// Función para cerrar sesión
function logout() {
  currentUser = null;
}

// Función para obtener usuario actual
function getCurrentUser() {
  return currentUser;
}
