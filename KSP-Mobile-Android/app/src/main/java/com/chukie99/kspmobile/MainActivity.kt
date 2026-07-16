package com.chukie99.kspmobile

import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import org.json.JSONArray
import java.text.NumberFormat
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var tvWelcome: TextView
    private lateinit var tvMemberNo: TextView
    private lateinit var tvTotalSimpanan: TextView
    private lateinit var tvSimpananPokok: TextView
    private lateinit var tvSimpananWajib: TextView
    private lateinit var tvSimpananSukarela: TextView
    private lateinit var tvPinjamanAktif: TextView
    private lateinit var tvTotalPinjaman: TextView
    private lateinit var tvLogout: TextView
    private lateinit var rvRiwayat: RecyclerView
    private lateinit var tvEmptyRiwayat: TextView
    private lateinit var progressBar: ProgressBar

    private var anggotaId: Long = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        anggotaId = intent.getLongExtra("anggota_id", 0)
        val namaAnggota = intent.getStringExtra("nama_anggota") ?: ""
        val noAnggota = intent.getStringExtra("no_anggota") ?: ""

        tvWelcome = findViewById(R.id.tvWelcome)
        tvMemberNo = findViewById(R.id.tvMemberNo)
        tvTotalSimpanan = findViewById(R.id.tvTotalSimpanan)
        tvSimpananPokok = findViewById(R.id.tvSimpananPokok)
        tvSimpananWajib = findViewById(R.id.tvSimpananWajib)
        tvSimpananSukarela = findViewById(R.id.tvSimpananSukarela)
        tvPinjamanAktif = findViewById(R.id.tvPinjamanAktif)
        tvTotalPinjaman = findViewById(R.id.tvTotalPinjaman)
        tvLogout = findViewById(R.id.tvLogout)
        rvRiwayat = findViewById(R.id.rvRiwayat)
        tvEmptyRiwayat = findViewById(R.id.tvEmptyRiwayat)
        progressBar = findViewById(R.id.progressBar)

        tvWelcome.text = namaAnggota
        tvMemberNo.text = noAnggota

        tvLogout.setOnClickListener { finish() }

        rvRiwayat.layoutManager = LinearLayoutManager(this)

        loadData()
    }

    private fun loadData() {
        progressBar.visibility = View.VISIBLE

        // Load simpanan
        ApiClient.get("simpanan?anggota_id=eq.$anggotaId&order=created_at.desc") { simpananRes, simpananErr ->
            runOnUiThread {
                var totalSimpanan = 0.0
                var pokok = 0.0
                var wajib = 0.0
                var sukarela = 0.0
                val riwayatList = mutableListOf<SimpananItem>()

                if (simpananRes != null && simpananErr == null) {
                    try {
                        val arr = JSONArray(simpananRes)
                        for (i in 0 until arr.length()) {
                            val item = arr.getJSONObject(i)
                            val nominal = item.getDouble("nominal")
                            val jenis = item.getString("jenis")
                            totalSimpanan += nominal
                            when (jenis) {
                                "pokok" -> pokok += nominal
                                "wajib" -> wajib += nominal
                                "sukarela" -> sukarela += nominal
                            }
                            riwayatList.add(SimpananItem(
                                jenis = jenis,
                                nominal = nominal,
                                created_at = item.getString("created_at")
                            ))
                        }
                    } catch (e: Exception) {}
                }

                // Load pinjaman
                ApiClient.get("pinjaman?anggota_id=eq.$anggotaId") { pinjamanRes, pinjamanErr ->
                    runOnUiThread {
                        var pinjamanAktif = 0
                        var totalSisa = 0.0

                        if (pinjamanRes != null && pinjamanErr == null) {
                            try {
                                val arr = JSONArray(pinjamanRes)
                                for (i in 0 until arr.length()) {
                                    val item = arr.getJSONObject(i)
                                    if (item.getString("status") == "aktif") {
                                        pinjamanAktif++
                                        totalSisa += item.getDouble("sisa_pinjaman")
                                    }
                                }
                            } catch (e: Exception) {}
                        }

                        val format = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
                        tvTotalSimpanan.text = format.format(totalSimpanan)
                        tvSimpananPokok.text = format.format(pokok)
                        tvSimpananWajib.text = format.format(wajib)
                        tvSimpananSukarela.text = format.format(sukarela)
                        tvPinjamanAktif.text = "$pinjamanAktif pinjaman"
                        tvTotalPinjaman.text = format.format(totalSisa)

                        if (riwayatList.isEmpty()) {
                            tvEmptyRiwayat.visibility = View.VISIBLE
                            rvRiwayat.visibility = View.GONE
                        } else {
                            tvEmptyRiwayat.visibility = View.GONE
                            rvRiwayat.visibility = View.VISIBLE
                            rvRiwayat.adapter = RiwayatAdapter(riwayatList)
                        }

                        progressBar.visibility = View.GONE
                    }
                }
            }
        }
    }
}

data class SimpananItem(
    val jenis: String,
    val nominal: Double,
    val created_at: String
)
