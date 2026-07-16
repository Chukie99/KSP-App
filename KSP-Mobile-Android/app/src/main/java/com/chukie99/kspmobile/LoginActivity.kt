package com.chukie99.kspmobile

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import io.github.jan.supabase.gotrue.gotrue
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.eq
import kotlinx.coroutines.launch

class LoginActivity : AppCompatActivity() {

    private lateinit var etUsername: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnLogin: Button
    private lateinit var progressBar: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        etUsername = findViewById(R.id.etUsername)
        etPassword = findViewById(R.id.etPassword)
        btnLogin = findViewById(R.id.btnLogin)
        progressBar = findViewById(R.id.progressBar)

        btnLogin.setOnClickListener {
            val username = etUsername.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (username.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Masukkan username dan password", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            login(username, password)
        }
    }

    private fun login(username: String, password: String) {
        progressBar.visibility = ProgressBar.VISIBLE
        btnLogin.isEnabled = false

        lifecycleScope.launch {
            try {
                // Cari user berdasarkan username
                val users = SupabaseClient.client.from("users")
                    .select {
                        eq("username", username)
                    }
                    .decodeList<User>()

                val user = users.firstOrNull()
                if (user == null) {
                    runOnUiThread {
                        Toast.makeText(this@LoginActivity, "User tidak ditemukan", Toast.LENGTH_SHORT).show()
                        progressBar.visibility = ProgressBar.GONE
                        btnLogin.isEnabled = true
                    }
                    return@launch
                }

                if (user.is_active != 1L) {
                    runOnUiThread {
                        Toast.makeText(this@LoginActivity, "Akun tidak aktif", Toast.LENGTH_SHORT).show()
                        progressBar.visibility = ProgressBar.GONE
                        btnLogin.isEnabled = true
                    }
                    return@launch
                }

                if (user.role != "anggota") {
                    runOnUiThread {
                        Toast.makeText(this@LoginActivity, "Hanya anggota yang bisa login di sini", Toast.LENGTH_SHORT).show()
                        progressBar.visibility = ProgressBar.GONE
                        btnLogin.isEnabled = true
                    }
                    return@launch
                }

                // Login dengan email (username@ksp.local)
                val email = "$username@ksp.local"
                SupabaseClient.client.gotrue.loginWith(email, password)

                // Get anggota data
                val anggotaList = SupabaseClient.client.from("anggota")
                    .select {
                        eq("user_id", user.id)
                    }
                    .decodeList<Anggota>()

                val anggota = anggotaList.firstOrNull()

                runOnUiThread {
                    val intent = Intent(this@LoginActivity, MainActivity::class.java)
                    intent.putExtra("user_id", user.id)
                    intent.putExtra("username", user.username)
                    intent.putExtra("nama_lengkap", user.nama_lengkap)
                    intent.putExtra("anggota_id", anggota?.id)
                    intent.putExtra("no_anggota", anggota?.no_anggota)
                    intent.putExtra("nama_anggota", anggota?.nama)
                    startActivity(intent)
                    finish()
                }
            } catch (e: Exception) {
                runOnUiThread {
                    Toast.makeText(this@LoginActivity, "Login gagal: ${e.message}", Toast.LENGTH_SHORT).show()
                    progressBar.visibility = ProgressBar.GONE
                    btnLogin.isEnabled = true
                }
            }
        }
    }
}
