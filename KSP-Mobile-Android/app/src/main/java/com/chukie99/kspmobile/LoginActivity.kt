package com.chukie99.kspmobile

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONArray

class LoginActivity : AppCompatActivity() {

    private lateinit var etLink: EditText
    private lateinit var etNik: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnLogin: Button
    private lateinit var progressBar: ProgressBar

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        etLink = findViewById(R.id.etLink)
        etNik = findViewById(R.id.etNik)
        etPassword = findViewById(R.id.etPassword)
        btnLogin = findViewById(R.id.btnLogin)
        progressBar = findViewById(R.id.progressBar)

        // Load saved link
        val prefs = getSharedPreferences("ksp", Context.MODE_PRIVATE)
        etLink.setText(prefs.getString("supabase_link", ""))

        btnLogin.setOnClickListener {
            val link = etLink.text.toString().trim()
            val nik = etNik.text.toString().trim()
            val password = etPassword.text.toString().trim()

            if (link.isEmpty() || nik.isEmpty() || password.isEmpty()) {
                Toast.makeText(this, "Isi semua field", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            login(link, nik, password)
        }
    }

    private fun login(link: String, nik: String, password: String) {
        progressBar.visibility = ProgressBar.VISIBLE
        btnLogin.isEnabled = false

        // Set Supabase config
        val url = if (link.endsWith("/")) link.dropLast(1) else link
        ApiClient.SUPABASE_URL = url
        ApiClient.SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"

        // Save link for next time
        getSharedPreferences("ksp", Context.MODE_PRIVATE)
            .edit().putString("supabase_link", url).apply()

        // Search by NIK
        ApiClient.get("anggota?nik=eq.$nik") { response, error ->
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
                        Toast.makeText(this, "Anggota tidak ditemukan", Toast.LENGTH_SHORT).show()
                        progressBar.visibility = ProgressBar.GONE
                        btnLogin.isEnabled = true
                        return@runOnUiThread
                    }

                    val anggota = arr.getJSONObject(0)
                    val anggotaId = anggota.getLong("id")
                    val noAnggota = anggota.getString("no_anggota")
                    val namaAnggota = anggota.getString("nama")
                    val status = anggota.getString("status")

                    if (status != "aktif") {
                        Toast.makeText(this, "Akun tidak aktif", Toast.LENGTH_SHORT).show()
                        progressBar.visibility = ProgressBar.GONE
                        btnLogin.isEnabled = true
                        return@runOnUiThread
                    }

                    // Simple password check (password = NIK for now)
                    // In production, use proper auth
                    if (password != nik && password != "ksp123") {
                        Toast.makeText(this, "Password salah", Toast.LENGTH_SHORT).show()
                        progressBar.visibility = ProgressBar.GONE
                        btnLogin.isEnabled = true
                        return@runOnUiThread
                    }

                    val intent = Intent(this, MainActivity::class.java)
                    intent.putExtra("anggota_id", anggotaId)
                    intent.putExtra("no_anggota", noAnggota)
                    intent.putExtra("nama_anggota", namaAnggota)
                    intent.putExtra("supabase_url", url)
                    startActivity(intent)
                    finish()
                } catch (e: Exception) {
                    Toast.makeText(this, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                    progressBar.visibility = ProgressBar.GONE
                    btnLogin.isEnabled = true
                }
            }
        }
    }
}
