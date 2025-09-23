import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ObjectUploader } from '@/components/ObjectUploader';
import { FileText, Upload, Satellite, Plus, Trash2 } from 'lucide-react';
import type { UploadResult } from '@uppy/core';

export default function DataCollection() {
  const [supplierType, setSupplierType] = useState('');
  const { toast } = useToast();

  // Form states for all collection types
  const [estateForm, setEstateForm] = useState({
    // Bagian 1 - Informasi Umum
    namaSupplier: '',
    namaGroup: '',
    aktaPendirian: '', // document URL
    aktaPerubahan: '', // document URL
    izinBerusaha: '', // NIB
    
    // Alamat
    alamatKantor: '',
    alamatKebun: '',
    
    // Koordinat
    koordinatKebun: '',
    koordinatKantor: '',
    
    // Jenis supplier
    jenisSupplier: '', // KKPA/Sister Company/Pihak Ketiga (checkboxes)
    totalProduksiTBSTahun: '',
    
    // Tim Internal yang bertanggung jawab mengawasi implementasi kebijakan keberlanjutan perusahaan
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTelefonTimInternal: '',
    
    // Penanggung Jawab
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTelefonPenanggungJawab: '',
    
    // Tanda Tangan
    tandaTangan: '',
    tanggalPengisianKuisioner: '',
    
    // Bagian 2 - Sumber TBS (Daftar Kebun)
    daftarKebun: [{
      no: 1,
      namaKebun: '',
      alamat: '',
      longitude: '',
      latitude: '',
      polygonKebun: '',
      luasLahan: 0, // Ha
      tahunTanam: '',
      jenisBibit: '',
      produksiTBS1Tahun: ''
    }]
  });

  const [smallholdersForm, setSmallholdersForm] = useState({
    nomorDO: '',
    pemegangDO: '',
    alamatPemegangDO: '',
    lokasiUsaha: '',
    aktaPendirianUsaha: '', // document URL
    nib: '',
    npwp: '',
    ktp: '', // document URL
    jenisUsaha: '', // New field: Unit Usaha Kecil Menengah/Small Medium Enterprise
    pemasokTBS: [{
      no: 1,
      namaPetani: '',
      alamatTempatTinggal: '',
      lokasiKebun: '',
      luas: 0, // Ha
      legalitasLahan: '', // document URL
      tahunTanam: '',
      stdb: '', // document URL
      sppl: '', // document URL
      nomorObjekPajakPBB: '',
      longitude: '',
      latitude: '',
    }]
  });

  const [millForm, setMillForm] = useState({
    // Bagian 1 - Informasi Umum
    umlId: '',
    namaPabrik: '',
    namaGroup: '',
    aktaPendirian: '', // document URL
    aktaPerubahan: '', // document URL
    izinBerusaha: '', // NIB
    tipeSertifikat: '', // ISPO/RSPO/ISCC/PROPER LINGKUNGAN,SMK3
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    
    // Alamat
    alamatKantor: '',
    alamatPabrik: '',
    
    // Koordinat
    koordinatPabrik: '',
    koordinatKantor: '',
    
    // Jenis supplier
    jenisSupplier: '', // KKPA/Sister Company/Pihak Ketiga
    kuantitasCPOPK: '', // M/T
    tanggalPengisianKuisioner: '',
    
    // Penanggung Jawab
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    
    // Tim Internal
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: ''
  });

  const [kcpForm, setKcpForm] = useState({
    ublFacilityId: '',
    namaKCP: '',
    namaGroup: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    alamatKantor: '',
    alamatKCP: '',
    koordinatKantor: '',
    koordinatKCP: '',
    modelChainOfCustody: '',
    kapasitasOlahMTHari: 0,
    kapasitasOlah: 0,
    sistemPencatatan: '',
    tanggalPengisianKuisioner: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: ''
  });

  const [bulkingForm, setBulkingForm] = useState({
    ublFacilityId: '',
    namaFasilitasBulking: '',
    namaGroup: '',
    izinBerusaha: '',
    tipeSertifikat: '',
    nomorSertifikat: '',
    lembagaSertifikasi: '',
    ruangLingkupSertifikasi: '',
    masaBerlakuSertifikat: '',
    alamatKantor: '',
    alamatBulking: '',
    modelChainOfCustody: '',
    kapasitasTotal: 0,
    sistemPencatatan: '',
    tanggalPengisianKuisioner: '',
    namaPenanggungJawab: '',
    jabatanPenanggungJawab: '',
    emailPenanggungJawab: '',
    nomorTeleponPenanggungJawab: '',
    namaTimInternal: '',
    jabatanTimInternal: '',
    emailTimInternal: '',
    nomorTeleponTimInternal: ''
  });

  // Mutations for creating data collections
  const createEstateMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/estate-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/estate-data-collection'] });
      toast({
        title: "Data Estate berhasil disimpan",
        description: "Data Estate telah berhasil disimpan ke sistem.",
      });
      // Reset form
      setEstateForm({
        namaSupplier: '', namaGroup: '', aktaPendirian: '', aktaPerubahan: '', izinBerusaha: '',
        tipeSertifikat: '', nomorSertifikat: '', lembagaSertifikasi: '', ruangLingkupSertifikasi: '',
        masaBerlakuSertifikat: '', linkDokumen: '', alamatKantor: '', alamatKebun: '', koordinatKebun: '',
        koordinatKantor: '', jenisSupplier: '', jenisKebun: '', totalProduksiTBSTahun: '', tanggalPengisianKuisioner: '',
        namaPenanggungJawab: '', jabatanPenanggungJawab: '', emailPenanggungJawab: '', nomorTeleponPenanggungJawab: '',
        namaTimInternal: '', jabatanTimInternal: '', emailTimInternal: '', nomorTeleponTimInternal: '',
        
        memilikiKebijakanPerlindunganHutan: false, memilikiKebijakanPerlindunganGambut: false
      });
    },
  });

  const createSmallholdersMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/traceability-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/traceability-data-collection'] });
      toast({
        title: "Data Smallholders berhasil disimpan",
        description: "Data Smallholders telah berhasil disimpan ke sistem.",
      });
      // Reset form
      setSmallholdersForm({
        nomorDO: '', pemegangDO: '', alamatPemegangDO: '', lokasiUsaha: '', aktaPendirianUsaha: '',
        nib: '', npwp: '', ktp: '', jenisUsaha: '',
        pemasokTBS: [{ no: 1, namaPetani: '', alamatTempatTinggal: '', lokasiKebun: '', luas: 0, legalitasLahan: '', tahunTanam: '', stdb: '', sppl: '', nomorObjekPajakPBB: '', longitude: '', latitude: '' }]
      });
    },
  });

  const createMillMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/mill-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mill-data-collection'] });
      toast({
        title: "Data Mill berhasil disimpan",
        description: "Data Mill telah berhasil disimpan ke sistem.",
      });
    },
  });

  const createKcpMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/kcp-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/kcp-data-collection'] });
      toast({
        title: "Data KCP berhasil disimpan",
        description: "Data KCP telah berhasil disimpan ke sistem.",
      });
    },
  });

  const createBulkingMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/bulking-data-collection', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bulking-data-collection'] });
      toast({
        title: "Data Bulking berhasil disimpan",
        description: "Data Bulking telah berhasil disimpan ke sistem.",
      });
    },
  });

  // Document upload functionality
  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest('/api/objects/upload', 'POST');
      return {
        method: 'PUT' as const,
        url: response.url || response.uploadURL,
      };
    } catch (error) {
      console.error('Error getting upload parameters:', error);
      throw error;
    }
  };

  const handleDocumentUploadComplete = (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>,
    fieldName: string,
    formType: 'estate' | 'mill' | 'smallholders' | 'kcp' | 'bulking'
  ) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const uploadURL = uploadedFile.response?.url || uploadedFile.uploadURL || '';
      const objectPath = uploadURL.includes('/uploads/') ? 
        `/objects/uploads/${uploadURL.split('/uploads/')[1]}` : 
        `/objects/uploads/${uploadedFile.id || 'unknown'}`;
      
      if (formType === 'estate') {
        setEstateForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'mill') {
        setMillForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'smallholders') {
        setSmallholdersForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'kcp') {
        setKcpForm(prev => ({ ...prev, [fieldName]: objectPath }));
      } else if (formType === 'bulking') {
        setBulkingForm(prev => ({ ...prev, [fieldName]: objectPath }));
      }
      
      toast({
        title: "Dokumen berhasil diunggah",
        description: `Dokumen telah disimpan dan terhubung dengan formulir ${formType}.`,
      });
    }
  };

  // Note: Kebun management moved to Spatial Analysis step

  // Add Pemasok function
  const addPemasok = () => {
    setSmallholdersForm(prev => ({
      ...prev,
      pemasokTBS: [
        ...prev.pemasokTBS,
        {
          no: prev.pemasokTBS.length + 1,
          namaPetani: '',
          alamatTempatTinggal: '',
          lokasiKebun: '',
          luas: 0,
          legalitasLahan: '',
          tahunTanam: '',
          stdb: '',
          sppl: '',
          nomorObjekPajakPBB: '',
          longitude: '',
          latitude: ''
        }
      ]
    }));
  };

  // Remove Pemasok function
  const removePemasok = (index: number) => {
    setSmallholdersForm(prev => ({
      ...prev,
      pemasokTBS: prev.pemasokTBS.filter((_, i) => i !== index).map((pemasok, i) => ({ ...pemasok, no: i + 1 }))
    }));
  };

  const handleEstateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEstateMutation.mutate(estateForm);
  };

  const handleSmallholdersSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSmallholdersMutation.mutate(smallholdersForm);
  };

  const handleMillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMillMutation.mutate(millForm);
  };

  const handleKcpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createKcpMutation.mutate(kcpForm);
  };

  const handleBulkingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBulkingMutation.mutate(bulkingForm);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 data-testid="text-page-title" className="text-3xl font-bold">
            Data Collection
          </h1>
          <p data-testid="text-page-description" className="text-muted-foreground mt-2">
            Sistem pengumpulan data komprehensif untuk kepatuhan EUDR dengan kemampuan unggah dokumen
          </p>
        </div>

        {/* Supplier Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Supplier Type</CardTitle>
            <CardDescription>
              Choose the supplier type to display the relevant data collection form
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={supplierType} onValueChange={setSupplierType}>
              <SelectTrigger className="w-full max-w-md" data-testid="select-supplier-type">
                <SelectValue placeholder="Select supplier type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="estate">Estate</SelectItem>
                <SelectItem value="mill">Mill</SelectItem>
                <SelectItem value="smallholders">Smallholders</SelectItem>
                <SelectItem value="kcp">KCP</SelectItem>
                <SelectItem value="bulking">Bulking</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Conditional Form Rendering */}
        {supplierType === 'estate' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data Estate</CardTitle>
              <CardDescription>
                (Kebun Sendiri/Kebun Satu Manajemen Pengelolaan/Third-Partied)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEstateSubmit} className="space-y-8">
                {/* Bagian 1 - Informasi Umum */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi Umum</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaSupplier">Nama Supplier <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="namaSupplier"
                        data-testid="input-nama-supplier-estate"
                        value={estateForm.namaSupplier}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, namaSupplier: e.target.value }))}
                        placeholder="Masukkan nama supplier"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="namaGroup">Nama Group / Parent Company Name</Label>
                      <Input
                        id="namaGroup"
                        data-testid="input-nama-group-estate"
                        value={estateForm.namaGroup}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, namaGroup: e.target.value }))}
                        placeholder="Masukkan nama group/parent company"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="izinBerusaha">Izin Berusaha (Nomor Induk Berusaha) <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="izinBerusaha"
                        data-testid="input-izin-berusaha-estate"
                        value={estateForm.izinBerusaha}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, izinBerusaha: e.target.value }))}
                        placeholder="Masukkan NIB"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jenisKebun">Jenis Kebun</Label>
                      <Select
                        value={estateForm.jenisKebun}
                        onValueChange={(value) => setEstateForm(prev => ({ ...prev, jenisKebun: value }))}
                      >
                        <SelectTrigger data-testid="select-jenis-kebun-estate">
                          <SelectValue placeholder="Pilih jenis kebun..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kebun-sendiri">Kebun Sendiri</SelectItem>
                          <SelectItem value="kebun-satu-manajemen">Kebun Satu Manajemen Pengelolaan</SelectItem>
                          <SelectItem value="third-partied">Third-Partied</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="alamatKebun">Alamat Kebun <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Textarea
                        id="alamatKebun"
                        data-testid="input-alamat-kebun-estate"
                        value={estateForm.alamatKebun}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, alamatKebun: e.target.value }))}
                        placeholder="Masukkan alamat kebun lengkap"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="koordinatKebun">Koordinat Kebun <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="koordinatKebun"
                        data-testid="input-koordinat-kebun-estate"
                        value={estateForm.koordinatKebun}
                        onChange={(e) => setEstateForm(prev => ({ ...prev, koordinatKebun: e.target.value }))}
                        placeholder="Latitude, Longitude"
                        required
                      />
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Dokumen Pendukung</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Akta Pendirian</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPendirian', 'estate')}
                          maxFileSize={10 * 1024 * 1024}
                        >
                          Upload File
                        </ObjectUploader>
                        {estateForm.aktaPendirian && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Akta Perubahan</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPerubahan', 'estate')}
                          maxFileSize={10 * 1024 * 1024}
                        >
                          Upload File
                        </ObjectUploader>
                        {estateForm.aktaPerubahan && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Note: Daftar Kebun moved to Step 2 - Spatial Analysis */}
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Satellite className="w-5 h-5" />
                      <h4 className="font-medium">Plot/Kebun Mapping</h4>
                    </div>
                    <p className="text-blue-700 text-sm mt-2">
                      Informasi daftar kebun dan plot akan dikelola di <strong>Step 2 - Spatial Analysis</strong> melalui upload GeoJSON file untuk akurasi koordinat yang lebih baik.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createEstateMutation.isPending} data-testid="button-submit-estate">
                    {createEstateMutation.isPending ? 'Menyimpan...' : 'Simpan Data Estate'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'smallholders' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data Smallholders</CardTitle>
              <CardDescription>
                (Kemampuan Telusur TBS Luar)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSmallholdersSubmit} className="space-y-8">
                {/* Bagian 1 - Informasi DO */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Bagian 1 – Informasi DO</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nomorDO">Nomor DO</Label>
                      <Input
                        id="nomorDO"
                        data-testid="input-nomor-do-smallholders"
                        value={smallholdersForm.nomorDO}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, nomorDO: e.target.value }))}
                        placeholder="Masukkan nomor DO"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="jenisUsaha">Jenis Usaha</Label>
                      <Select
                        value={smallholdersForm.jenisUsaha}
                        onValueChange={(value) => setSmallholdersForm(prev => ({ ...prev, jenisUsaha: value }))}
                      >
                        <SelectTrigger data-testid="select-jenis-usaha-smallholders">
                          <SelectValue placeholder="Pilih jenis usaha..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unit-usaha-kecil-menengah">Unit Usaha Kecil Menengah</SelectItem>
                          <SelectItem value="small-medium-enterprise">Small Medium Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="pemegangDO">Pemegang DO</Label>
                      <Input
                        id="pemegangDO"
                        data-testid="input-pemegang-do-smallholders"
                        value={smallholdersForm.pemegangDO}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, pemegangDO: e.target.value }))}
                        placeholder="Masukkan pemegang DO"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="alamatPemegangDO">Alamat Pemegang DO</Label>
                      <Textarea
                        id="alamatPemegangDO"
                        data-testid="input-alamat-pemegang-do-smallholders"
                        value={smallholdersForm.alamatPemegangDO}
                        onChange={(e) => setSmallholdersForm(prev => ({ ...prev, alamatPemegangDO: e.target.value }))}
                        placeholder="Masukkan alamat pemegang DO"
                      />
                    </div>
                  </div>

                  {/* Document Upload Section */}
                  <div className="space-y-4">
                    <h4 className="text-md font-medium">Dokumen Pendukung</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>KTP</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'ktp', 'smallholders')}
                          maxFileSize={5 * 1024 * 1024}
                        >
                          Upload File
                        </ObjectUploader>
                        {smallholdersForm.ktp && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Akta Pendirian Usaha</Label>
                        <ObjectUploader
                          onGetUploadParameters={handleGetUploadParameters}
                          onComplete={(result: any) => handleDocumentUploadComplete(result, 'aktaPendirianUsaha', 'smallholders')}
                          maxFileSize={10 * 1024 * 1024}
                        >
                          Upload File
                        </ObjectUploader>
                        {smallholdersForm.aktaPendirianUsaha && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <FileText size={16} />
                            <span>Dokumen telah diunggah</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bagian 2 - Daftar Pemasok TBS */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold border-b pb-2">Bagian 2 – Daftar Pemasok TBS</h3>
                    <Button type="button" onClick={addPemasok} size="sm" data-testid="button-add-pemasok">
                      <Plus size={16} className="mr-1" />
                      Tambah Pemasok
                    </Button>
                  </div>
                  
                  {smallholdersForm.pemasokTBS.map((pemasok, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Pemasok #{pemasok.no}</h4>
                        {smallholdersForm.pemasokTBS.length > 1 && (
                          <Button type="button" variant="destructive" size="sm" onClick={() => removePemasok(index)} data-testid={`button-remove-pemasok-${index}`}>
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`namaPetani-${index}`}>Nama Petani</Label>
                          <Input
                            id={`namaPetani-${index}`}
                            value={pemasok.namaPetani}
                            onChange={(e) => {
                              const newPemasok = [...smallholdersForm.pemasokTBS];
                              newPemasok[index].namaPetani = e.target.value;
                              setSmallholdersForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                            }}
                            placeholder="Masukkan nama petani"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`luas-${index}`}>Luas (Ha)</Label>
                          <Input
                            id={`luas-${index}`}
                            type="number"
                            value={pemasok.luas}
                            onChange={(e) => {
                              const newPemasok = [...smallholdersForm.pemasokTBS];
                              newPemasok[index].luas = parseFloat(e.target.value) || 0;
                              setSmallholdersForm(prev => ({ ...prev, pemasokTBS: newPemasok }));
                            }}
                            placeholder="Masukkan luas lahan"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createSmallholdersMutation.isPending} data-testid="button-submit-smallholders">
                    {createSmallholdersMutation.isPending ? 'Menyimpan...' : 'Simpan Data Smallholders'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'mill' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data Mill</CardTitle>
              <CardDescription>
                (Pabrik Kelapa Sawit)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMillSubmit} className="space-y-8">
                {/* Basic Mill Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Informasi Dasar Mill</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaPabrik">Nama Pabrik <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="namaPabrik"
                        data-testid="input-nama-pabrik-mill"
                        value={millForm.namaPabrik}
                        onChange={(e) => setMillForm(prev => ({ ...prev, namaPabrik: e.target.value }))}
                        placeholder="Masukkan nama pabrik"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kuantitasCPOPK">Kuantitas CPO/PK <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="kuantitasCPOPK"
                        data-testid="input-kuantitas-cpo-pk-mill"
                        value={millForm.kuantitasCPOPK}
                        onChange={(e) => setMillForm(prev => ({ ...prev, kuantitasCPOPK: e.target.value }))}
                        placeholder="Masukkan kuantitas dalam M/T"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createMillMutation.isPending} data-testid="button-submit-mill">
                    {createMillMutation.isPending ? 'Menyimpan...' : 'Simpan Data Mill'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'kcp' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data KCP</CardTitle>
              <CardDescription>
                (Kernel Crushing Plant)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleKcpSubmit} className="space-y-8">
                {/* Basic KCP Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Informasi Dasar KCP</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaKCP">Nama KCP <span className="text-xs text-red-600 font-medium">WAJIB</span></Label>
                      <Input
                        id="namaKCP"
                        data-testid="input-nama-kcp"
                        value={kcpForm.namaKCP}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, namaKCP: e.target.value }))}
                        placeholder="Masukkan nama KCP"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kapasitasOlahMTHari">Kapasitas Olah (MT/Hari)</Label>
                      <Input
                        id="kapasitasOlahMTHari"
                        type="number"
                        data-testid="input-kapasitas-olah-kcp"
                        value={kcpForm.kapasitasOlahMTHari}
                        onChange={(e) => setKcpForm(prev => ({ ...prev, kapasitasOlahMTHari: parseFloat(e.target.value) || 0 }))}
                        placeholder="Masukkan kapasitas"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createKcpMutation.isPending} data-testid="button-submit-kcp">
                    {createKcpMutation.isPending ? 'Menyimpan...' : 'Simpan Data KCP'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {supplierType === 'bulking' && (
          <Card>
            <CardHeader>
              <CardTitle>Formulir Pengumpulan Data Bulking</CardTitle>
              <CardDescription>
                (Fasilitas Bulking/Storage)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBulkingSubmit} className="space-y-8">
                {/* Basic Bulking Information */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold border-b pb-2">Informasi Dasar Bulking</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="namaFasilitasBulking">Nama Fasilitas Bulking</Label>
                      <Input
                        id="namaFasilitasBulking"
                        data-testid="input-nama-fasilitas-bulking"
                        value={bulkingForm.namaFasilitasBulking}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, namaFasilitasBulking: e.target.value }))}
                        placeholder="Masukkan nama fasilitas"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="kapasitasTotal">Kapasitas Total (MT)</Label>
                      <Input
                        id="kapasitasTotal"
                        type="number"
                        data-testid="input-kapasitas-total-bulking"
                        value={bulkingForm.kapasitasTotal}
                        onChange={(e) => setBulkingForm(prev => ({ ...prev, kapasitasTotal: parseFloat(e.target.value) || 0 }))}
                        placeholder="Masukkan kapasitas total"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={createBulkingMutation.isPending} data-testid="button-submit-bulking">
                    {createBulkingMutation.isPending ? 'Menyimpan...' : 'Simpan Data Bulking'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* View Consolidated Results CTA - Show when any supplier type is selected */}
        {supplierType && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    View Consolidated Assessment Results
                  </h3>
                  <p className="text-blue-700 mb-4 max-w-2xl mx-auto">
                    Review comprehensive supplier assessments with AI-powered analysis, compliance scoring, and risk evaluation across all your data collection efforts.
                  </p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/supply-chain-analysis'}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 font-medium"
                  data-testid="button-view-consolidated-results"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  View Consolidated Results & Analysis
                  <span className="ml-2">→</span>
                </Button>
                <p className="text-sm text-blue-600 mt-2">
                  Access detailed reports, compliance status, and risk assessments
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}