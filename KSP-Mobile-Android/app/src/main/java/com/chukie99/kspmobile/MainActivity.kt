package com.chukie99.kspmobile

import android.os.Bundle
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.eq
import kotlinx.coroutines.launch
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
    private var userId: Long = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        userId = intent.getLongExtra("user_id", 0)
        anggotaId = intent.getLongExtra("anggota_id", 0)
        val namaLengkap = intent.getStringExtra("nama_lengkap") ?: ""
        val noAnggota = intent.getStringExtra("no_anggota") ?: ""
        val namaAnggota = intent.getStringExtra("nama_anggota") ?: ""

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

        tvLogout.setOnClickListener {
            finish()
        }

        rvRiwayat.layoutManager = LinearLayoutManager(this)

        loadData()
    }

    private fun loadData() {
        progressBar.visibility = View.VISIBLE

        lifecycleScope.launch {
            try {
                // Load simpanan
                val simpananList = SupabaseClient.client.from("simpanan")
                    .select {
                        eq("anggota_id", anggotaId)
                    }
                    .decodeList<Simpanan>()

                var totalSimpanan = 0.0
                var pokok = 0.0
                var wajib = 0.0
                var sukarela = 0.0

                simpananList.forEach { s ->
                    totalSimpanan += s.nominal
                    when (s.jenis) {
                        "pokok" -> pokok += s.nominal
                        "wajib" -> wajib += s.nominal
                        "sukarela" -> sukarela += s.nominal
                    }
                }

                // Load pinjaman
                val pinjamanList = SupabaseClient.client.from("pinjaman")
                    .select {
                        eq("anggota_id", anggotaId)
                    }
                    .decodeList<Pinjaman>()

                val pinjamanAktif = pinjamanList.filter { it.status == "aktif" }
                val totalSisa = pinjamanAktif.sumOf { it.sisa_pinjaman }

                runOnUiThread {
                    val format = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
                    tvTotalSimpanan.text = format.format(totalSimpanan)
                    tvSimpananPokok.text = format.format(pokok)
                    tvSimpananWajib.text = format.format(wajib)
                    tvSimpananSukarela.text = format.format(sukarela)
                    tvPinjamanAktif.text = "${pinjamanAktif.size} pinjaman"
                    tvTotalPinjaman.text = format.format(totalSisa)

                    // Setup riwayat adapter
                    val riwayatAdapter = RiwayatAdapter(simpananList.sortedByDescending { it.created_at })
                    rvRiwayat.adapter = riwayatAdapter

                    if (simpananList.isEmpty()) {
                        tvEmptyRiwayat.visibility = View.VISIBLE
                        rvRiwayat.visibility = View.GONE
                    } else {
                        tvEmptyRiwayat.visibility = View.GONE
                        rvRiwayat.visibility = View.VISIBLE
                    }

                    progressBar.visibility = View.GONE
                }
            } catch (e: Exception) {
                runOnUiThread {
                    progressBar.visibility = View.GONE
                }
            }
        }
    }
}
