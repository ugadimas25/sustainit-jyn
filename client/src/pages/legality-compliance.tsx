import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ObjectUploader } from '@/components/ObjectUploader';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, FileText, Upload, Download, Eye } from 'lucide-react';
import type { UploadResult } from '@uppy/core';


export default function LegalityCompliance() {
  const [activeTab, setActiveTab] = useState('supplier-compliance');
  const { toast } = useToast();

  const [supplierComplianceForm, setSupplierComplianceForm] = useState({
    // Basic Information
    namaSupplier: '',
    namaGroup: '',
    aktaPendirianPerusahaan: '',
    aktaPerubahan: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    alamatKantor: '',
    alamatKebun: '',
    koordinatKebun: '',
    koordinatKantor: '',
    jenisSupplier: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTelefonPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: '',
    
    // 3.1 Hak Penggunaan Tanah
    historisPerolehanTanah: '',
    historisKeterangan: '',
    izinPencadanganLahan: '',
    izinPencadanganKeterangan: '',
    persetujuanPKKPR: '',
    persetujuanPKKPRKeterangan: '',
    izinUsahaPerkebunan: '',
    izinUsahaPerkebunanKeterangan: '',
    skHGU: '',
    skHGUKeterangan: '',
    sertifikatHGU: '',
    sertifikatHGUKeterangan: '',
    laporanPemanfaatanHGU: '',
    laporanPemanfaatanHGUKeterangan: '',
    laporanLPUP: '',
    laporanLPUPKeterangan: '',
    
    // 3.2 Perlindungan Lingkungan Hidup
    izinLingkungan: '',
    izinLingkunganKeterangan: '',
    izinRintekTPS: '',
    izinRintekTPSKeterangan: '',
    izinPertekLimbah: '',
    izinPertekLimbahKeterangan: '',
    persetujuanAndalalin: '',
    persetujuanAndalalinKeterangan: '',
    daftarPestisida: '',
    daftarPestisidaKeterangan: '',
    
    // 3.3 Bukti Pelaksanaan
    buktiPelaksanaan: '',
    buktiPelaksanaanKeterangan: '',
    laporanRKLRPL: '',
    laporanRKLRPLKeterangan: '',
    laporanPestisida: '',
    laporanPestisidaKeterangan: '',
    
    // 3.4 Peraturan Kehutanan
    areaSesuaiPeruntukan: '',
    areaSesuaiPeruntukanKeterangan: '',
    skPelepasanHutan: '',
    skPelepasanHutanKeterangan: '',
    dokumenInstansiRelevant: '',
    dokumenInstansiRelevanKeterangan: '',
    
    // 3.5 Hak Pihak Ketiga dan Masyarakat Adat
    kebijakanHakPihakKetiga: '',
    kebijakanHakPihakKetigaKeterangan: '',
    kebijakanPerusahaan: '',
    kebijakanPerusahaanKeterangan: '',
    sopGRTT: '',
    sopGRTTKeterangan: '',
    sopPADIATAPA: '',
    sopPADIATAPAKeterangan: '',
    sopPermintaanInformasi: '',
    sopPermintaanInformasiKeterangan: '',
    sopKeluhanStakeholder: '',
    sopKeluhanStakeholderKeterangan: '',
    
    // 3.6 Kewajiban Pengembangan Plasma
    mouKerjaSama: '',
    mouKerjaSamaKeterangan: '',
    skCPCL: '',
    skCPCLKeterangan: '',
    laporanRealisasiPlasma: '',
    laporanRealisasiPlasmaKeterangan: '',
    
    // 3.7 Bukti Implementasi
    buktiGRTT: '',
    buktiGRTTKeterangan: '',
    buktiFPIC: '',
    buktiFPICKeterangan: '',
    suratMasukPermintaan: '',
    suratMasukPermintaanKeterangan: '',
    suratKeluarPermintaan: '',
    suratKeluarPermintaanKeterangan: '',
    suratMasukKeluhan: '',
    suratMasukKeluhanKeterangan: '',
    suratKeluarKeluhan: '',
    suratKeluarKeluhanKeterangan: '',
    
    // 3.8 Sengketa Lahan
    laporanSengketaLahan: '',
    laporanSengketaLahanKeterangan: '',
    
    // 3.9 Hak Buruh dan HAM
    komitmenHakBuruh: '',
    kebijakanHakBuruh: '',
    kebijakanHakBuruhKeterangan: '',
    sopKetenagakerjaan: '',
    sopKetenagakerjaanKeterangan: '',
    sopK3: '',
    sopK3Keterangan: '',
    
    // 3.10 Bukti Pelaksanaan HAM
    buktiPerjanjianKerja: '',
    buktiPerjanjianKerjaKeterangan: '',
    daftarKaryawan: '',
    daftarKaryawanKeterangan: '',
    skUMR: '',
    skUMRKeterangan: '',
    skSerikatPekerja: '',
    skSerikatPekerjaKeterangan: '',
    buktiBPJS: '',
    buktiBPJSKeterangan: '',
    laporanP2K3: '',
    laporanP2K3Keterangan: '',
    
    // 3.11 Perpajakan dan Antikorupsi
    komitmenAntikorupsi: '',
    kebijakanAntikorupsi: '',
    kebijakanAntikorupsiKeterangan: '',
    sopKodeEtik: '',
    sopKodeEtikKeterangan: '',
    saluranPengaduan: '',
    saluranPengaduanKeterangan: '',
    
    // 3.12 Bukti Pajak dan Ekspor
    suratTerdaftarPajak: '',
    suratTerdaftarPajakKeterangan: '',
    npwp: '',
    npwpKeterangan: '',
  });

  const createSupplierComplianceMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/supplier-compliance', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supplier-compliance'] });
      toast({
        title: "Data Supplier Compliance berhasil disimpan",
        description: "Data Kepatuhan Hukum Supplier telah berhasil disimpan ke sistem.",
      });
      setActiveTab('results');
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menyimpan data",
        description: error.message || "Terjadi kesalahan saat menyimpan data supplier compliance.",
        variant: "destructive",
      });
    },
  });

  const handleSupplierComplianceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSupplierComplianceMutation.mutate(supplierComplianceForm);
  };

  const handleGetUploadParameters = async () => {
    try {
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      return {
        method: 'PUT' as const,
        url: data.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleDocumentUploadComplete = (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
    fieldName: string
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.response?.uploadURL || uploadedFile.uploadURL || '';
      const objectPath = uploadURL.includes('/uploads/') ? 
        `/objects${uploadURL.split('/uploads')[1]}` : uploadURL;
      
      setSupplierComplianceForm(prev => ({ ...prev, [fieldName]: objectPath }));
      
      toast({
        title: "Dokumen berhasil diunggah",
        description: `Dokumen untuk ${fieldName} telah berhasil diunggah.`,
      });
    }
  };

  // Dummy data for results table
  const dummySupplierComplianceData = [
    {
      id: 1,
      namaSupplier: 'PT Kebun Kelapa Sawit Sejahtera',
      tingkatKepatuhan: 85,
      statusKepatuhan: 'Compliant',
      tanggalPenilaian: '15 November 2024',
      nomorTelefonTimInternal: '+62 811-2345-6789',
      emailKontak: 'compliance@kebun-sejahtera.co.id'
    },
    {
      id: 2,
      namaSupplier: 'CV Perkebunan Nusantara',
      tingkatKepatuhan: 92,
      statusKepatuhan: 'Highly Compliant',
      tanggalPenilaian: '18 November 2024',
      nomorTelefonTimInternal: '+62 812-3456-7890',
      emailKontak: 'legal@perkebunan-nusantara.co.id'
    },
    {
      id: 3,
      namaSupplier: 'Koperasi Tani Mandiri',
      tingkatKepatuhan: 68,
      statusKepatuhan: 'Partially Compliant',
      tanggalPenilaian: '20 November 2024',
      nomorTeleponTimInternal: '+62 813-4567-8901',
      emailKontak: 'koperasi@tani-mandiri.co.id'
    }
  ];

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Legality Compliance</h1>
          <p className="text-gray-600">
            Sistem penilaian kepatuhan hukum supplier untuk memastikan compliance dengan regulasi EUDR
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supplier-compliance" data-testid="tab-supplier-compliance">Supplier Compliance</TabsTrigger>
            <TabsTrigger value="results" data-testid="tab-results">Hasil Penilaian</TabsTrigger>
          </TabsList>

          {/* Supplier Compliance Tab */}
          <TabsContent value="supplier-compliance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Formulir Informasi Kepatuhan Hukum</CardTitle>
                <CardDescription>
                  (Kebun Sendiri/Kebun Satu Manajemen Pengelolaan/Third-Partied)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSupplierComplianceSubmit} className="space-y-8">
                  {/* Basic Information Section - Exact format from document */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Nama Supplier :</Label>
                        <Input
                          value={supplierComplianceForm.namaSupplier}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaSupplier: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Nama Group / Parent Company Name :</Label>
                        <Input
                          value={supplierComplianceForm.namaGroup}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Akta Pendirian Perusahaan :</Label>
                        <Input
                          value={supplierComplianceForm.aktaPendirianPerusahaan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, aktaPendirianPerusahaan: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Akta Perubahan (Jika Ada) :</Label>
                        <Input
                          value={supplierComplianceForm.aktaPerubahan}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, aktaPerubahan: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium">Izin Berusaha (Nomor Induk Berusaha) :</Label>
                        <Input
                          value={supplierComplianceForm.izinBerusaha}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium">Tipe Sertifikat Yang Dimiliki Perusahaan :</Label>
                        <Input
                          value={supplierComplianceForm.tipeSertifikat}
                          onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, tipeSertifikat: e.target.value }))}
                          placeholder="(ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3)"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Alamat</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Kantor :</Label>
                          <Textarea
                            value={supplierComplianceForm.alamatKantor}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, alamatKantor: e.target.value }))}
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Kebun :</Label>
                          <Textarea
                            value={supplierComplianceForm.alamatKebun}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, alamatKebun: e.target.value }))}
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Koordinat</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Kebun :</Label>
                          <Input
                            value={supplierComplianceForm.koordinatKebun}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, koordinatKebun: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Kantor :</Label>
                          <Input
                            value={supplierComplianceForm.koordinatKantor}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, koordinatKantor: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium">Jenis supplier :</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="kkpa"
                            name="jenisSupplier"
                            value="kkpa"
                            checked={supplierComplianceForm.jenisSupplier === 'kkpa'}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jenisSupplier: e.target.value }))}
                          />
                          <Label htmlFor="kkpa">Kebun plasma yang dikelola penuh oleh perusahaan (KKPA)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="sister"
                            name="jenisSupplier"
                            value="sister"
                            checked={supplierComplianceForm.jenisSupplier === 'sister'}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jenisSupplier: e.target.value }))}
                          />
                          <Label htmlFor="sister">Kebun dalam satu grup manajemen (sister company)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="third-party"
                            name="jenisSupplier"
                            value="third-party"
                            checked={supplierComplianceForm.jenisSupplier === 'third-party'}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jenisSupplier: e.target.value }))}
                          />
                          <Label htmlFor="third-party">Kebun pihak ketiga (PT/ CV/ Koperasi)</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Penanggung Jawab</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Nama :</Label>
                          <Input
                            value={supplierComplianceForm.namaPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaPenanggungJawab: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Jabatan :</Label>
                          <Input
                            value={supplierComplianceForm.jabatanPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jabatanPenanggungJawab: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Email :</Label>
                          <Input
                            type="email"
                            value={supplierComplianceForm.emailPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, emailPenanggungJawab: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Nomor Telfon / Handphone :</Label>
                          <Input
                            value={supplierComplianceForm.nomorTelefonPenanggungJawab}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, nomorTelefonPenanggungJawab: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="font-medium text-lg">Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahaan</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Nama :</Label>
                          <Input
                            value={supplierComplianceForm.namaTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, namaTimInternal: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Jabatan :</Label>
                          <Input
                            value={supplierComplianceForm.jabatanTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, jabatanTimInternal: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="font-medium">Email :</Label>
                          <Input
                            type="email"
                            value={supplierComplianceForm.emailTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, emailTimInternal: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Nomor Telfon / Handphone :</Label>
                          <Input
                            value={supplierComplianceForm.nomorTeleponTimInternal}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, nomorTelefonTimInternal: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-8" />

                  {/* Legal Compliance Section */}
                  <div className="space-y-8">
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                      <h3 className="text-xl font-bold text-blue-800">Legal Compliance</h3>
                      <p className="text-sm text-blue-600 mt-2">Berlaku Untuk Perusahaan Yang Belum Sertifikasi ISPO</p>
                    </div>

                    {/* I. Hak Penggunaan Tanah */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">I. Hak Penggunaan Tanah</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Apakah Perusahaan Memiliki Historis Perolehan Tanah</Label>
                        
                        {/* a. Izin Pencadangan Lahan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Izin Pencadangan Lahan</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinPencadangan-yes"
                                name="izinPencadanganLahan"
                                value="yes"
                                checked={supplierComplianceForm.izinPencadanganLahan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinPencadanganLahan: e.target.value }))}
                              />
                              <Label htmlFor="izinPencadangan-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinPencadangan-no"
                                name="izinPencadanganLahan"
                                value="no"
                                checked={supplierComplianceForm.izinPencadanganLahan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinPencadanganLahan: e.target.value }))}
                              />
                              <Label htmlFor="izinPencadangan-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinPencadanganKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinPencadanganKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinPencadanganDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. PKKPR / Izin Lokasi */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. Persetujuan Kesesuaian Kegiatan Pemanfaatan Ruang (PKKPR) / Izin Lokasi</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="pkkpr-yes"
                                name="persetujuanPKKPR"
                                value="yes"
                                checked={supplierComplianceForm.persetujuanPKKPR === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanPKKPR: e.target.value }))}
                              />
                              <Label htmlFor="pkkpr-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="pkkpr-no"
                                name="persetujuanPKKPR"
                                value="no"
                                checked={supplierComplianceForm.persetujuanPKKPR === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanPKKPR: e.target.value }))}
                              />
                              <Label htmlFor="pkkpr-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.persetujuanPKKPRKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanPKKPRKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'pkkprDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. Izin Usaha Perkebunan */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. Izin Usaha Perkebunan</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinUsaha-yes"
                                name="izinUsahaPerkebunan"
                                value="yes"
                                checked={supplierComplianceForm.izinUsahaPerkebunan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinUsahaPerkebunan: e.target.value }))}
                              />
                              <Label htmlFor="izinUsaha-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinUsaha-no"
                                name="izinUsahaPerkebunan"
                                value="no"
                                checked={supplierComplianceForm.izinUsahaPerkebunan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinUsahaPerkebunan: e.target.value }))}
                              />
                              <Label htmlFor="izinUsaha-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinUsahaPerkebunanKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinUsahaPerkebunanKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinUsahaDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* d. SK HGU */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">d. SK HGU</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skHGU-yes"
                                name="skHGU"
                                value="yes"
                                checked={supplierComplianceForm.skHGU === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skHGU: e.target.value }))}
                              />
                              <Label htmlFor="skHGU-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="skHGU-no"
                                name="skHGU"
                                value="no"
                                checked={supplierComplianceForm.skHGU === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skHGU: e.target.value }))}
                              />
                              <Label htmlFor="skHGU-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.skHGUKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, skHGUKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'skHGUDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* e. Sertifikat HGU */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">e. Sertifikat HGU</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sertifikatHGU-yes"
                                name="sertifikatHGU"
                                value="yes"
                                checked={supplierComplianceForm.sertifikatHGU === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sertifikatHGU: e.target.value }))}
                              />
                              <Label htmlFor="sertifikatHGU-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="sertifikatHGU-no"
                                name="sertifikatHGU"
                                value="no"
                                checked={supplierComplianceForm.sertifikatHGU === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sertifikatHGU: e.target.value }))}
                              />
                              <Label htmlFor="sertifikatHGU-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.sertifikatHGUKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, sertifikatHGUKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'sertifikatHGUDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* f. Laporan Pemanfaatan HGU */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">f. Laporan Pemanfaatan HGU</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanHGU-yes"
                                name="laporanPemanfaatanHGU"
                                value="yes"
                                checked={supplierComplianceForm.laporanPemanfaatanHGU === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPemanfaatanHGU: e.target.value }))}
                              />
                              <Label htmlFor="laporanHGU-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="laporanHGU-no"
                                name="laporanPemanfaatanHGU"
                                value="no"
                                checked={supplierComplianceForm.laporanPemanfaatanHGU === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPemanfaatanHGU: e.target.value }))}
                              />
                              <Label htmlFor="laporanHGU-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.laporanPemanfaatanHGUKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPemanfaatanHGUKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'laporanHGUDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* g. Laporan Perkembangan Usaha Perkebunan (LPUP) */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">g. Laporan Perkembangan Usaha Perkebunan (LPUP)</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="lpup-yes"
                                name="laporanLPUP"
                                value="yes"
                                checked={supplierComplianceForm.laporanLPUP === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanLPUP: e.target.value }))}
                              />
                              <Label htmlFor="lpup-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="lpup-no"
                                name="laporanLPUP"
                                value="no"
                                checked={supplierComplianceForm.laporanLPUP === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanLPUP: e.target.value }))}
                              />
                              <Label htmlFor="lpup-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.laporanLPUPKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanLPUPKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'lpupDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* II. Perlindungan Lingkungan Hidup */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">II. Perlindungan Lingkungan Hidup</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Apakah Perusahaan Memiliki Perizinan Lingkungan Sesuai dengan Regulasi yang Relevan</Label>
                        
                        {/* a. Izin Lingkungan dan Dokumen Terkait */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">a. Izin Lingkungan dan Dokumen Terkait</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLingkungan-yes"
                                name="izinLingkungan"
                                value="yes"
                                checked={supplierComplianceForm.izinLingkungan === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLingkungan: e.target.value }))}
                              />
                              <Label htmlFor="izinLingkungan-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLingkungan-no"
                                name="izinLingkungan"
                                value="no"
                                checked={supplierComplianceForm.izinLingkungan === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLingkungan: e.target.value }))}
                              />
                              <Label htmlFor="izinLingkungan-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinLingkunganKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLingkunganKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinLingkunganDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* b. Izin / Rintek TPS Limbah B3 */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">b. Izin / Rintek TPS Limbah B3</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinRintek-yes"
                                name="izinRintekTPS"
                                value="yes"
                                checked={supplierComplianceForm.izinRintekTPS === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinRintekTPS: e.target.value }))}
                              />
                              <Label htmlFor="izinRintek-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinRintek-no"
                                name="izinRintekTPS"
                                value="no"
                                checked={supplierComplianceForm.izinRintekTPS === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinRintekTPS: e.target.value }))}
                              />
                              <Label htmlFor="izinRintek-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinRintekTPSKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinRintekTPSKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinRintekDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* c. Izin / Pertek Pengelolaan Limbah Cair Industri */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">c. Izin / Pertek Pengelolaan Limbah Cair Industri</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLimbahCair-yes"
                                name="izinLimbahCair"
                                value="yes"
                                checked={supplierComplianceForm.izinLimbahCair === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLimbahCair: e.target.value }))}
                              />
                              <Label htmlFor="izinLimbahCair-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="izinLimbahCair-no"
                                name="izinLimbahCair"
                                value="no"
                                checked={supplierComplianceForm.izinLimbahCair === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLimbahCair: e.target.value }))}
                              />
                              <Label htmlFor="izinLimbahCair-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.izinLimbahCairKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, izinLimbahCairKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'izinLimbahCairDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* d. Persetujuan Teknis ANDALALIN */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">d. Persetujuan Teknis ANDALALIN</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="andalalin-yes"
                                name="persetujuanAndalalin"
                                value="yes"
                                checked={supplierComplianceForm.persetujuanAndalalin === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanAndalalin: e.target.value }))}
                              />
                              <Label htmlFor="andalalin-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="andalalin-no"
                                name="persetujuanAndalalin"
                                value="no"
                                checked={supplierComplianceForm.persetujuanAndalalin === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanAndalalin: e.target.value }))}
                              />
                              <Label htmlFor="andalalin-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.persetujuanAndalalinKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, persetujuanAndalalinKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'andalalinDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* e. Daftar pestisida dan izin edar yang masih berlaku */}
                        <div className="space-y-4 border-t pt-4">
                          <Label className="font-medium">e. Daftar pestisida dan izin edar yang masih berlaku</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="daftarPestisida-yes"
                                name="daftarPestisida"
                                value="yes"
                                checked={supplierComplianceForm.daftarPestisida === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarPestisida: e.target.value }))}
                              />
                              <Label htmlFor="daftarPestisida-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="daftarPestisida-no"
                                name="daftarPestisida"
                                value="no"
                                checked={supplierComplianceForm.daftarPestisida === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarPestisida: e.target.value }))}
                              />
                              <Label htmlFor="daftarPestisida-no">No</Label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Keterangan:</Label>
                            <Textarea
                              value={supplierComplianceForm.daftarPestisidaKeterangan}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, daftarPestisidaKeterangan: e.target.value }))}
                              rows={2}
                            />
                            <div className="space-y-2">
                              <Label>Upload Dokumen Pendukung:</Label>
                              <ObjectUploader
                                onGetUploadParameters={handleGetUploadParameters}
                                onComplete={(result) => handleDocumentUploadComplete(result, 'daftarPestisidaDokumen')}
                                maxFileSize={50 * 1024 * 1024}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload PDF Dokumen
                              </ObjectUploader>
                            </div>
                          </div>
                        </div>

                        {/* Berikan Bukti Pelaksanaan prosedur */}
                        <div className="space-y-6 border-t pt-4 mt-6">
                          <Label className="font-medium text-blue-700">Berikan Bukti Pelaksanaan prosedur point II diatas</Label>
                          <div className="flex space-x-4">
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiPelaksanaanII-yes"
                                name="buktiPelaksanaanII"
                                value="yes"
                                checked={supplierComplianceForm.buktiPelaksanaanII === 'yes'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiPelaksanaanII: e.target.value }))}
                              />
                              <Label htmlFor="buktiPelaksanaanII-yes">Yes</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input
                                type="radio"
                                id="buktiPelaksanaanII-no"
                                name="buktiPelaksanaanII"
                                value="no"
                                checked={supplierComplianceForm.buktiPelaksanaanII === 'no'}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, buktiPelaksanaanII: e.target.value }))}
                              />
                              <Label htmlFor="buktiPelaksanaanII-no">No</Label>
                            </div>
                          </div>

                          {/* a. Laporan Pelaksanaan RKL/RPL */}
                          <div className="space-y-4 border-t pt-4">
                            <Label className="font-medium">a. Laporan Pelaksanaan RKL/RPL</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="laporanRKLRPL-yes"
                                  name="laporanRKLRPL"
                                  value="yes"
                                  checked={supplierComplianceForm.laporanRKLRPL === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRKLRPL: e.target.value }))}
                                />
                                <Label htmlFor="laporanRKLRPL-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="laporanRKLRPL-no"
                                  name="laporanRKLRPL"
                                  value="no"
                                  checked={supplierComplianceForm.laporanRKLRPL === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRKLRPL: e.target.value }))}
                                />
                                <Label htmlFor="laporanRKLRPL-no">No</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.laporanRKLRPLKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanRKLRPLKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'laporanRKLRPLDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>

                          {/* b. Laporan Penggunaan Pestisida */}
                          <div className="space-y-4 border-t pt-4">
                            <Label className="font-medium">b. Laporan Penggunaan Pestisida</Label>
                            <div className="flex space-x-4">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="laporanPestisida-yes"
                                  name="laporanPestisida"
                                  value="yes"
                                  checked={supplierComplianceForm.laporanPestisida === 'yes'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPestisida: e.target.value }))}
                                />
                                <Label htmlFor="laporanPestisida-yes">Yes</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id="laporanPestisida-no"
                                  name="laporanPestisida"
                                  value="no"
                                  checked={supplierComplianceForm.laporanPestisida === 'no'}
                                  onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPestisida: e.target.value }))}
                                />
                                <Label htmlFor="laporanPestisida-no">No</Label>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Keterangan:</Label>
                              <Textarea
                                value={supplierComplianceForm.laporanPestisidaKeterangan}
                                onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, laporanPestisidaKeterangan: e.target.value }))}
                                rows={2}
                              />
                              <div className="space-y-2">
                                <Label>Upload Dokumen Pendukung:</Label>
                                <ObjectUploader
                                  onGetUploadParameters={handleGetUploadParameters}
                                  onComplete={(result) => handleDocumentUploadComplete(result, 'laporanPestisidaDokumen')}
                                  maxFileSize={50 * 1024 * 1024}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  Upload PDF Dokumen
                                </ObjectUploader>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* III. Peraturan Kehutanan */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">III. Peraturan Kehutanan</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Apakah lokasi konsesi perkebunan berada di areal yang telah memperoleh pelepasan kawasan hutan atau di luar kawasan hutan sesuai dengan ketentuan peraturan perundang-undangan</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="peraturanKehutanan-yes"
                              name="peraturanKehutanan"
                              value="yes"
                              checked={supplierComplianceForm.peraturanKehutanan === 'yes'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, peraturanKehutanan: e.target.value }))}
                            />
                            <Label htmlFor="peraturanKehutanan-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="peraturanKehutanan-no"
                              name="peraturanKehutanan"
                              value="no"
                              checked={supplierComplianceForm.peraturanKehutanan === 'no'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, peraturanKehutanan: e.target.value }))}
                            />
                            <Label htmlFor="peraturanKehutanan-no">No</Label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan:</Label>
                          <Textarea
                            value={supplierComplianceForm.peraturanKehutananKeterangan}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, peraturanKehutananKeterangan: e.target.value }))}
                            rows={2}
                          />
                          <div className="space-y-2">
                            <Label>Upload Dokumen Pendukung:</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'peraturanKehutananDokumen')}
                              maxFileSize={50 * 1024 * 1024}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload PDF Dokumen
                            </ObjectUploader>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* IV. Hak Pihak Ke 3 termasuk Masyarakat Adat */}
                    <div className="space-y-6 border p-6 rounded-lg">
                      <h3 className="text-lg font-bold">IV. Hak Pihak Ke 3 termasuk Masyarakat Adat</h3>
                      <div className="space-y-4">
                        <Label className="font-medium">Apakah dalam pembukaan atau pengembangan kebun kelapa sawit terdapat konflik dengan pihak ke 3 termasuk masyarakat adat</Label>
                        <div className="flex space-x-4">
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="hakPihakKetiga-yes"
                              name="hakPihakKetiga"
                              value="yes"
                              checked={supplierComplianceForm.hakPihakKetiga === 'yes'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, hakPihakKetiga: e.target.value }))}
                            />
                            <Label htmlFor="hakPihakKetiga-yes">Yes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="radio"
                              id="hakPihakKetiga-no"
                              name="hakPihakKetiga"
                              value="no"
                              checked={supplierComplianceForm.hakPihakKetiga === 'no'}
                              onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, hakPihakKetiga: e.target.value }))}
                            />
                            <Label htmlFor="hakPihakKetiga-no">No</Label>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Keterangan:</Label>
                          <Textarea
                            value={supplierComplianceForm.hakPihakKetigaKeterangan}
                            onChange={(e) => setSupplierComplianceForm(prev => ({ ...prev, hakPihakKetigaKeterangan: e.target.value }))}
                            rows={2}
                          />
                          <div className="space-y-2">
                            <Label>Upload Dokumen Pendukung:</Label>
                            <ObjectUploader
                              onGetUploadParameters={handleGetUploadParameters}
                              onComplete={(result) => handleDocumentUploadComplete(result, 'hakPihakKetigaDokumen')}
                              maxFileSize={50 * 1024 * 1024}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload PDF Dokumen
                            </ObjectUploader>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4 pt-6">
                    <Button 
                      type="submit" 
                      data-testid="button-submit-supplier-compliance"
                      className="w-full" 
                      disabled={createSupplierComplianceMutation.isPending}
                    >
                      {createSupplierComplianceMutation.isPending ? 'Menyimpan...' : 'Simpan Data Supplier Compliance'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hasil Penilaian Kepatuhan Supplier</CardTitle>
                <CardDescription>
                  Daftar supplier yang telah dinilai tingkat kepatuhannya terhadap regulasi hukum
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Supplier</TableHead>
                        <TableHead>Tingkat Kepatuhan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal Penilaian</TableHead>
                        <TableHead>Kontak</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dummySupplierComplianceData.map((compliance) => (
                        <TableRow key={compliance.id}>
                          <TableCell className="font-medium">{compliance.namaSupplier}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="w-12 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    compliance.tingkatKepatuhan >= 90 ? 'bg-green-500' : 
                                    compliance.tingkatKepatuhan >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${compliance.tingkatKepatuhan}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium">{compliance.tingkatKepatuhan}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={compliance.tingkatKepatuhan >= 90 ? 'default' : compliance.tingkatKepatuhan >= 75 ? 'secondary' : 'destructive'}>
                              {compliance.statusKepatuhan}
                            </Badge>
                          </TableCell>
                          <TableCell>{compliance.tanggalPenilaian}</TableCell>
                          <TableCell className="text-sm">
                            <div>{compliance.nomorTelefonTimInternal}</div>
                            <div className="text-muted-foreground">{compliance.emailKontak}</div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
