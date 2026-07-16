package com.chukie99.kspmobile

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONArray
import org.json.JSONObject

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

        ApiClient.get("users?username=eq.$username&is_active=eq.1") { response, error ->
            runOnUiThread {
                if (error != null) {
                    Toast.makeText(this, "Error: $error", Toast.LENGTH_SHORT).show()
                    progressBar.visibility = ProgressBar.GONE
                    btnLogin.isEnabled = true
                    return@runOnUiThread
                }

                try {
                    val arr = JSONArray(response)
                    if (arr.length() == 0) {
                        Toast.makeText(this, "User tidak ditemukan", Toast.LENGTH_SHORT).show()
                        progressBar.visibility = ProgressBar.GONE
                        btnLogin.isEnabled = true
                        return@runOnUiThread
                    }

                    val user = arr.getJSONObject(0)
                    val role = user.getString("role")
                    val userId = user.getLong("id")
                    val namaLengkap = user.getString("nama_lengkap")

                    if (role != "anggota") {
                        Toast.makeText(this, "Hanya anggota yang bisa login di sini", Toast.LENGTH_SHORT).show()
                        progressBar.visibility = ProgressBar.GONE
                        btnLogin.isEnabled = true
                        return@runOnUiThread
                    }

                    // Get anggota data
                    ApiClient.get("anggota?user_id=eq.$userId") { anggotaRes, anggotaErr ->
                        runOnUiThread {
                            if (anggotaErr != null) {
                                Toast.makeText(this, "Error: $anggotaErr", Toast.LENGTH_SHORT).show()
                                progressBar.visibility = ProgressBar.GONE
                                btnLogin.isEnabled = true
                                return@runOnUiThread
                            }

                            val anggotaArr = JSONArray(anggotaRes)
                            var anggotaId: Long = 0
                            var noAnggota = ""
                            var namaAnggota = ""

                            if (anggotaArr.length() > 0) {
                                val anggota = anggotaArr.getJSONObject(0)
                                anggotaId = anggota.getLong("id")
                                noAnggota = anggota.getString("no_anggota")
                                namaAnggota = anggota.getString("nama")
                            }

                            val intent = Intent(this, MainActivity::class.java)
                            intent.putExtra("user_id", userId)
                            intent.putExtra("username", username)
                            intent.putExtra("nama_lengkap", namaLengkap)
                            intent.putExtra("anggota_id", anggotaId)
                            intent.putExtra("no_anggota", noAnggota)
                            intent.putExtra("nama_anggota", namaAnggota)
                            startActivity(intent)
                            finish()
                        }
                    }
                } catch (e: Exception) {
                    Toast.makeText(this, "Parse error: ${e.message}", Toast.LENGTH_SHORT).show()
                    progressBar.visibility = ProgressBar.GONE
                    btnLogin.isEnabled = true
                }
            }
        }
    }
}
